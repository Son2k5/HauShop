using api.data;
using api.DTOs.order;
using api.events;
using api.exceptions;
using api.infrastructure.redis;
using api.mappings;
using api.models.entities;
using api.models.enums;
using api.repositories.interfaces;
using api.services.interfaces.caching;
using api.services.interfaces.cart;
using api.services.interfaces.order;
using api.services.interfaces.payment;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.order
{
    public class OrderService : IOrderService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IProductVariantRepository _productVariantRepository;
        private readonly ApplicationDbContext _context;
        private readonly IVnPayService _vnPayService;
        private readonly IRedisCacheService _cache;
        private readonly IRedisEventBus _eventBus;
        private readonly ICartCacheService _cartCache;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            ICartRepository cartRepository,
            IOrderRepository orderRepository,
            IProductVariantRepository productVariantRepository,
            ApplicationDbContext context,
            IVnPayService vnPayService,
            IRedisCacheService cache,
            IRedisEventBus eventBus,
            ICartCacheService cartCache,
            ILogger<OrderService> logger)
        {
            _cartRepository = cartRepository;
            _orderRepository = orderRepository;
            _productVariantRepository = productVariantRepository;
            _context = context;
            _vnPayService = vnPayService;
            _cache = cache;
            _eventBus = eventBus;
            _cartCache = cartCache;
            _logger = logger;
        }

        public async Task<CheckoutResponseDto> CheckoutAsync(
            string userId,
            CreateOrderDto dto,
            HttpContext httpContext,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.ShippingAddressId))
                throw new InvalidOperationException("ShippingAddressId là bắt buộc");

            var address = await _context.Addresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == dto.ShippingAddressId && a.UserId == userId, ct);

            if (address == null)
                throw new KeyNotFoundException("Không tìm thấy địa chỉ giao hàng");

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, ct);

            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy thông tin người dùng");

            var cart = await _cartRepository.GetTrackedByUserIdWithItemsAsync(userId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy giỏ hàng");

            if (cart.Items == null || cart.Items.Count == 0)
                throw new InvalidOperationException("Giỏ hàng trống");

            await using var tx = await _context.Database.BeginTransactionAsync(ct);

            try
            {
                decimal subtotal = 0;
                var shippingFee = dto.ShippingFee < 0 ? 0 : dto.ShippingFee;
                var variantIds = cart.Items
                    .Select(i => i.ProductVariantId)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct()
                    .ToList();

                if (variantIds.Count != cart.Items.Count)
                    throw new InvalidOperationException("Cart item thiếu ProductVariantId");

                var variantsById = await _context.ProductVariants
                    .Include(v => v.Product)
                    .Where(v => variantIds.Contains(v.Id))
                    .ToDictionaryAsync(v => v.Id, ct);

                var fullAddress = $"{address.AddressLine}, {address.City}, {address.State}, {address.Country}".Replace(", ,", ",").Trim(',', ' ');

                var order = new Order
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    Status = OrderStatus.Pending,
                    ShippingAddressId = dto.ShippingAddressId,
                    Subtotal = 0,
                    ShippingFee = shippingFee,
                    ReceiverName = $"{user.FirstName} {user.LastName}".Trim(),
                    ReceiverPhone = user.PhoneNumber ?? string.Empty,
                    AddressLine = fullAddress,
                    Created = DateTime.UtcNow,
                    Updated = null,
                    OrderItems = new List<OrderItem>(),
                    Payments = new List<Payment>()
                };

                foreach (var cartItem in cart.Items)
                {
                    var variant = variantsById.GetValueOrDefault(cartItem.ProductVariantId!)
                        ?? throw new KeyNotFoundException($"Không tìm thấy biến thể sản phẩm: {cartItem.ProductVariantId}");

                    if (!variant.IsActive)
                        throw new InvalidOperationException($"Biến thể {variant.Sku} không còn khả dụng");

                    if (variant.Product == null || !variant.Product.IsActive)
                        throw new InvalidOperationException("Sản phẩm không còn khả dụng");

                    if (variant.Stock < cartItem.Quantity)
                        throw new InvalidOperationException(
                            $"Biến thể {variant.Sku} không đủ tồn kho. Còn lại: {variant.Stock}");

                    variant.Stock -= cartItem.Quantity;

                    var itemTotal = variant.Price * cartItem.Quantity;
                    subtotal += itemTotal;

                    order.OrderItems.Add(new OrderItem
                    {
                        Id = Guid.NewGuid().ToString(),
                        OrderId = order.Id,
                        ProductId = variant.ProductId,
                        Product = variant.Product,
                        ProductVariantId = variant.Id,
                        ProductName = variant.Product.Name,
                        VariantSku = variant.Sku,
                        VariantSize = variant.Size,
                        VariantColor = variant.Color,
                        Quantity = cartItem.Quantity,
                        Price = variant.Price,
                        Total = itemTotal,
                        Created = DateTime.UtcNow
                    });
                }

                order.Subtotal = subtotal;
                order.Total = subtotal + shippingFee;

                var payment = new Payment
                {
                    Id = Guid.NewGuid().ToString(),
                    OrderId = order.Id,
                    Method = dto.PaymentMethod,
                    Status = PaymentStatus.Pending,
                    Amount = order.Total,
                    TransactionNo = $"{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..32],
                    Provider = dto.PaymentMethod.ToString(),
                    ProviderTransactionId = null,
                    ResponseCode = null,
                    BankCode = null,
                    OrderInfo = string.IsNullOrWhiteSpace(dto.Note)
                        ? $"Thanh toan don hang {order.Id}"
                        : dto.Note.Trim(),
                    Created = DateTime.UtcNow,
                    PaidAt = null,
                    Updated = null
                };

                order.Payments.Add(payment);

                order.ShippingDetail = new ShippingDetail
                {
                    Id = Guid.NewGuid().ToString(),
                    OrderId = order.Id,
                    Method = ShippingMethod.Standard,
                    Fee = shippingFee,
                    Created = DateTime.UtcNow
                };

                _orderRepository.Add(order);

                string? paymentUrl = null;

                if (dto.PaymentMethod == PaymentMethod.COD)
                {
                    _cartRepository.RemoveCartItems(cart.Items);
                }
                else if (dto.PaymentMethod == PaymentMethod.VNPay)
                {
                    paymentUrl = _vnPayService.CreatePaymentUrl(httpContext, order, payment);
                }
                else
                {
                    throw new InvalidOperationException("Phương thức thanh toán không được hỗ trợ");
                }

                await _context.SaveChangesAsync(ct);

                await UpdateProductStocksDirectAsync(
                    order.OrderItems.Select(i => i.ProductId),
                    ct);

                await _context.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);

                var affectedProductIds = order.OrderItems
                    .Select(i => i.ProductId)
                    .Distinct()
                    .ToList();

                await InvalidateProductCachesAsync(affectedProductIds, ct);
                if (dto.PaymentMethod == PaymentMethod.COD)
                    await _cartCache.RemoveUserCartAsync(userId, ct);

                var orderEvent = new OrderCreatedEvent
                {
                    OrderId = order.Id,
                    UserId = userId,
                    Total = order.Total,
                    PaymentMethod = dto.PaymentMethod,
                    ProductIds = affectedProductIds,
                    CreatedAtUtc = DateTime.UtcNow
                };

                await _eventBus.PublishAsync(RedisChannels.OrderCreated, orderEvent, ct);
                await _eventBus.EnqueueAsync(RedisStreams.OrderEvents, orderEvent, ct);

                var created = await _orderRepository.GetByIdWithIncludesAsync(order.Id, ct)
                    ?? throw new InvalidOperationException("Không thể tải lại order sau checkout");

                _logger.LogInformation(
                    "Checkout success. OrderId={OrderId}, UserId={UserId}, PaymentMethod={PaymentMethod}, Total={Total}",
                    order.Id, userId, dto.PaymentMethod, order.Total);

                return new CheckoutResponseDto
                {
                    Order = OrderMapping.MapToDto(created),
                    RequiresRedirect = dto.PaymentMethod == PaymentMethod.VNPay,
                    PaymentUrl = paymentUrl
                };
            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
        }

        public async Task<PagedOrderDto> GetMyOrdersAsync(
            string userId,
            int page = 1,
            int pageSize = 10,
            CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var (items, total) = await _orderRepository.GetByUserIdAsync(userId, page, pageSize, ct);
            return new PagedOrderDto
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<OrderDto> GetMyOrderByIdAsync(string userId, string orderId, CancellationToken ct = default)
        {
            var order = await _orderRepository.GetByIdWithIncludesAsync(orderId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

            if (order.UserId != userId)
                throw new ForbiddenAccessException("Bạn không có quyền xem đơn hàng này");

            return OrderMapping.MapToDto(order);
        }

        public async Task<OrderDto> CancelMyOrderAsync(string userId, string orderId, CancellationToken ct = default)
        {
            var order = await _orderRepository.GetTrackedByIdWithIncludesAsync(orderId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

            if (order.UserId != userId)
                throw new ForbiddenAccessException("Bạn không có quyền hủy đơn hàng này");

            if (order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Chỉ có thể hủy đơn hàng ở trạng thái Pending");

            order.Status = OrderStatus.Cancelled;
            order.Updated = DateTime.UtcNow;

            var variantIds = order.OrderItems
                .Select(i => i.ProductVariantId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();
            var variantsById = await _context.ProductVariants
                .Where(v => variantIds.Contains(v.Id))
                .ToDictionaryAsync(v => v.Id, ct);

            foreach (var item in order.OrderItems)
            {
                if (string.IsNullOrWhiteSpace(item.ProductVariantId))
                    continue;

                if (variantsById.TryGetValue(item.ProductVariantId, out var variant))
                    variant.Stock += item.Quantity;
            }

            foreach (var payment in order.Payments.Where(p => p.Status == PaymentStatus.Pending))
            {
                payment.Status = PaymentStatus.Failed;
                payment.Updated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(ct);

            await UpdateProductStocksDirectAsync(
                order.OrderItems.Select(i => i.ProductId),
                ct);

            await _context.SaveChangesAsync(ct);

            await InvalidateProductCachesAsync(
                order.OrderItems.Select(i => i.ProductId).Distinct(),
                ct);

            var updated = await _orderRepository.GetByIdWithIncludesAsync(orderId, ct)
                ?? throw new InvalidOperationException("Không thể tải lại đơn hàng sau khi hủy");

            return OrderMapping.MapToDto(updated);
        }

        public async Task<OrderDto> HandleVnPayReturnAsync(IQueryCollection query, CancellationToken ct = default)
        {
            if (!_vnPayService.ValidateSignature(query))
                throw new InvalidOperationException("Sai chữ ký VNPay");

            var transactionNo = query["vnp_TxnRef"].ToString();
            if (string.IsNullOrWhiteSpace(transactionNo))
                throw new InvalidOperationException("Thiếu mã giao dịch VNPay");

            var order = await _orderRepository.GetTrackedByTransactionNoAsync(transactionNo, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng theo giao dịch");

            var payment = order.Payments.FirstOrDefault(p => p.TransactionNo == transactionNo)
                ?? throw new KeyNotFoundException("Không tìm thấy payment tương ứng");

            var responseCode = query["vnp_ResponseCode"].ToString();

            payment.ResponseCode = responseCode;
            payment.ProviderTransactionId = query["vnp_TransactionNo"].ToString();
            payment.BankCode = query["vnp_BankCode"].ToString();
            payment.PaidAt = _vnPayService.ParsePayDate(query["vnp_PayDate"].ToString());
            payment.Updated = DateTime.UtcNow;

            if (responseCode == "00")
            {
                payment.Status = PaymentStatus.Paid;
                order.Status = OrderStatus.Processing;
                order.Updated = DateTime.UtcNow;

                var cart = await _cartRepository.GetTrackedByUserIdWithItemsAsync(order.UserId, ct);
                if (cart != null && cart.Items.Count > 0)
                {
                    _cartRepository.RemoveCartItems(cart.Items);
                }
            }
            else
            {
                payment.Status = PaymentStatus.Failed;
                order.Status = OrderStatus.Cancelled;
                order.Updated = DateTime.UtcNow;

                var variantIds = order.OrderItems
                    .Select(i => i.ProductVariantId)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct()
                    .ToList();
                var variantsById = await _context.ProductVariants
                    .Where(v => variantIds.Contains(v.Id))
                    .ToDictionaryAsync(v => v.Id, ct);

                foreach (var item in order.OrderItems)
                {
                    if (string.IsNullOrWhiteSpace(item.ProductVariantId))
                        continue;

                    if (variantsById.TryGetValue(item.ProductVariantId, out var variant))
                        variant.Stock += item.Quantity;
                }
            }

            await _context.SaveChangesAsync(ct);

            await UpdateProductStocksDirectAsync(
                order.OrderItems.Select(i => i.ProductId),
                ct);

            await _context.SaveChangesAsync(ct);

            await InvalidateProductCachesAsync(
                order.OrderItems.Select(i => i.ProductId).Distinct(),
                ct);

            if (responseCode == "00")
                await _cartCache.RemoveUserCartAsync(order.UserId, ct);

            var updated = await _orderRepository.GetByIdWithIncludesAsync(order.Id, ct)
                ?? throw new InvalidOperationException("Không thể tải lại đơn hàng sau callback");

            return OrderMapping.MapToDto(updated);
        }

        private async Task InvalidateProductCachesAsync(IEnumerable<string> productIds, CancellationToken ct)
        {
            foreach (var productId in productIds)
            {
                await _cache.RemoveAsync(RedisCacheKeys.ProductDetail(productId), ct);
            }

            await _cache.RemoveByPrefixAsync(RedisCacheKeys.ProductListPrefix, ct);
            await _cache.RemoveByPrefixAsync(RedisCacheKeys.ProductSlugPrefix, ct);
            await _cache.RemoveByPrefixAsync(RedisCacheKeys.HomepagePrefix, ct);
        }

        private async Task UpdateProductStocksDirectAsync(IEnumerable<string> productIds, CancellationToken ct)
        {
            var ids = productIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            if (ids.Count == 0) return;

            var totals = await _context.ProductVariants
                .Where(v => ids.Contains(v.ProductId) && v.IsActive)
                .GroupBy(v => v.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    Stock = g.Sum(v => v.Stock)
                })
                .ToListAsync(ct);

            var totalsByProduct = totals.ToDictionary(t => t.ProductId, t => t.Stock);
            var products = await _context.Products
                .Where(p => ids.Contains(p.Id))
                .ToListAsync(ct);

            foreach (var product in products)
            {
                product.Stock = totalsByProduct.GetValueOrDefault(product.Id, 0);
                product.Updated = DateTime.UtcNow;
            }
        }
    }
}
