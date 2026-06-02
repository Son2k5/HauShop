using api.data;
using api.DTOs.order;
using api.common;
using api.mappings;
using api.models.entities;
using api.models.enums;
using api.repositories.interfaces;
using api.services.interfaces.caching;
using api.services.interfaces.cart;
using api.services.interfaces.notification;
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
        private readonly ICacheService _cache;
        private readonly IEventBus _eventBus;
        private readonly ICartCacheService _cartCache;
        private readonly INotificationService _notificationService;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            ICartRepository cartRepository,
            IOrderRepository orderRepository,
            IProductVariantRepository productVariantRepository,
            ApplicationDbContext context,
            IVnPayService vnPayService,
            ICacheService cache,
            IEventBus eventBus,
            ICartCacheService cartCache,
            INotificationService notificationService,
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
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<CheckoutResponseDto> CheckoutAsync(
            string userId,
            CreateOrderDto dto,
            HttpContext httpContext,
            CancellationToken ct = default)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            var checkoutResult = await strategy.ExecuteAsync(async () =>
            {
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

                var initialStatus = dto.PaymentMethod == PaymentMethod.COD
                    ? OrderStatus.OrderPlaced
                    : OrderStatus.Pending;

                var order = new Order
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    Status = initialStatus,
                    ShippingAddressId = dto.ShippingAddressId,
                    Subtotal = 0,
                    ShippingFee = shippingFee,
                    ReceiverName = $"{user.FirstName} {user.LastName}".Trim(),
                    ReceiverPhone = user.PhoneNumber ?? string.Empty,
                    AddressLine = fullAddress,
                    Created = DateTime.UtcNow,
                    Updated = null,
                    OrderItems = new List<OrderItem>(),
                    Payments = new List<Payment>(),
                    StatusHistories = new List<OrderStatusHistory>()
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

                order.StatusHistories.Add(CreateStatusHistory(
                    order.Id,
                    initialStatus,
                    null,
                    null,
                    dto.PaymentMethod == PaymentMethod.COD
                        ? "Don hang da duoc dat va dang cho nguoi ban xac nhan."
                        : "Don hang da duoc tao va dang cho thanh toan.",
                    null));

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

                var affectedProductIds = order.OrderItems
                    .Select(i => i.ProductId)
                    .Distinct()
                    .ToList();

                await _context.SaveChangesAsync(ct);

                await UpdateProductStocksDirectAsync(affectedProductIds, ct);

                await _context.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);

                return (
                    OrderId: order.Id,
                    Total: order.Total,
                    AffectedProductIds: affectedProductIds,
                    PaymentUrl: paymentUrl);

            }
            catch
            {
                await tx.RollbackAsync(ct);
                _context.ChangeTracker.Clear();
                throw;
            }

            });

            _context.ChangeTracker.Clear();

            await InvalidateProductCachesAsync(checkoutResult.AffectedProductIds, ct);
            if (dto.PaymentMethod == PaymentMethod.COD)
                await _cartCache.RemoveUserCartAsync(userId, ct);

            var orderEvent = new OrderCreatedEvent
            {
                OrderId = checkoutResult.OrderId,
                UserId = userId,
                Total = checkoutResult.Total,
                PaymentMethod = dto.PaymentMethod,
                ProductIds = checkoutResult.AffectedProductIds,
                CreatedAtUtc = DateTime.UtcNow
            };

            await _eventBus.PublishAsync(EventTopics.OrderCreatedChannel, orderEvent, ct);
            await _eventBus.EnqueueAsync(EventTopics.OrderEventsStream, orderEvent, ct);
            await TryNotifyAsync(
                token => _notificationService.NotifyOrderCreatedAsync(checkoutResult.OrderId, token),
                checkoutResult.OrderId,
                "order-created",
                ct);

            var created = await _orderRepository.GetByIdWithIncludesAsync(checkoutResult.OrderId, ct)
                ?? throw new InvalidOperationException("Không thể tải lại order sau checkout");

            _logger.LogInformation(
                "Checkout success. OrderId={OrderId}, UserId={UserId}, PaymentMethod={PaymentMethod}, Total={Total}",
                checkoutResult.OrderId, userId, dto.PaymentMethod, checkoutResult.Total);

            return new CheckoutResponseDto
            {
                Order = OrderMapping.MapToDto(created),
                RequiresRedirect = dto.PaymentMethod == PaymentMethod.VNPay,
                PaymentUrl = checkoutResult.PaymentUrl
            };
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

            if (!CanCustomerCancel(order.Status))
                throw new InvalidOperationException("Chỉ có thể hủy đơn hàng ở trạng thái Pending");

            var previousStatus = order.Status;
            order.Status = OrderStatus.Cancelled;
            order.Updated = DateTime.UtcNow;
            order.StatusHistories.Add(CreateStatusHistory(
                order.Id,
                OrderStatus.Cancelled,
                userId,
                Role.Member.ToString(),
                "Khach hang da huy don hang.",
                null));

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

            var affectedProductIds = order.OrderItems
                .Select(i => i.ProductId)
                .Distinct()
                .ToList();

            await _context.SaveChangesAsync(ct);

            await UpdateProductStocksDirectAsync(affectedProductIds, ct);

            await _context.SaveChangesAsync(ct);

            await InvalidateProductCachesAsync(affectedProductIds, ct);
            await TryNotifyAsync(
                token => _notificationService.NotifyOrderStatusChangedAsync(orderId, previousStatus, OrderStatus.Cancelled, token),
                orderId,
                "order-cancelled",
                ct);

            var updated = await _orderRepository.GetByIdWithIncludesAsync(orderId, ct)
                ?? throw new InvalidOperationException("Không thể tải lại đơn hàng sau khi hủy");

            return OrderMapping.MapToDto(updated);
        }

        public async Task<OrderDto> CompleteMyOrderAsync(string userId, string orderId, CancellationToken ct = default)
        {
            var order = await _orderRepository.GetTrackedByIdWithIncludesAsync(orderId, ct)
                ?? throw new KeyNotFoundException("Order not found");

            if (order.UserId != userId)
                throw new ForbiddenAccessException("You cannot complete this order");

            if (order.Status != OrderStatus.Delivered)
                throw new InvalidOperationException("Only delivered orders can be completed by the customer");

            var previousStatus = order.Status;
            order.Status = OrderStatus.Completed;
            order.Updated = DateTime.UtcNow;
            order.StatusHistories.Add(CreateStatusHistory(
                order.Id,
                OrderStatus.Completed,
                userId,
                Role.Member.ToString(),
                "Khach hang xac nhan da nhan hang.",
                order.ShippingDetail?.CurrentLocation));

            await _context.SaveChangesAsync(ct);
            await TryNotifyAsync(
                token => _notificationService.NotifyOrderStatusChangedAsync(orderId, previousStatus, OrderStatus.Completed, token),
                orderId,
                "order-completed",
                ct);

            var updated = await _orderRepository.GetByIdWithIncludesAsync(orderId, ct)
                ?? throw new InvalidOperationException("Cannot reload order after completing");

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
            var previousStatus = order.Status;

            payment.ResponseCode = responseCode;
            payment.ProviderTransactionId = query["vnp_TransactionNo"].ToString();
            payment.BankCode = query["vnp_BankCode"].ToString();
            payment.PaidAt = _vnPayService.ParsePayDate(query["vnp_PayDate"].ToString());
            payment.Updated = DateTime.UtcNow;

            if (responseCode == "00")
            {
                payment.Status = PaymentStatus.Paid;
                order.Status = OrderStatus.OrderPlaced;
                order.Updated = DateTime.UtcNow;
                order.StatusHistories.Add(CreateStatusHistory(
                    order.Id,
                    OrderStatus.PaymentSucceeded,
                    null,
                    "PaymentProvider",
                    "Thanh toan VNPay thanh cong.",
                    null));
                order.StatusHistories.Add(CreateStatusHistory(
                    order.Id,
                    OrderStatus.OrderPlaced,
                    null,
                    "System",
                    "Don hang da duoc dat va dang cho nguoi ban xac nhan.",
                    null));

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
                order.StatusHistories.Add(CreateStatusHistory(
                    order.Id,
                    OrderStatus.Cancelled,
                    null,
                    "PaymentProvider",
                    "Thanh toan that bai, don hang da bi huy.",
                    null));

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

            var affectedProductIds = order.OrderItems
                .Select(i => i.ProductId)
                .Distinct()
                .ToList();

            await _context.SaveChangesAsync(ct);

            await UpdateProductStocksDirectAsync(affectedProductIds, ct);

            await _context.SaveChangesAsync(ct);

            await InvalidateProductCachesAsync(affectedProductIds, ct);

            if (responseCode == "00")
            {
                await _cartCache.RemoveUserCartAsync(order.UserId, ct);
                await TryNotifyAsync(
                    token => _notificationService.NotifyPaymentSucceededAsync(order.Id, token),
                    order.Id,
                    "payment-succeeded",
                    ct);
                await TryNotifyAsync(
                    token => _notificationService.NotifyOrderStatusChangedAsync(order.Id, previousStatus, OrderStatus.OrderPlaced, token),
                    order.Id,
                    "order-processing",
                    ct);
            }
            else
            {
                await TryNotifyAsync(
                    token => _notificationService.NotifyOrderStatusChangedAsync(order.Id, previousStatus, OrderStatus.Cancelled, token),
                    order.Id,
                    "payment-failed-order-cancelled",
                    ct);
            }

            var updated = await _orderRepository.GetByIdWithIncludesAsync(order.Id, ct)
                ?? throw new InvalidOperationException("Không thể tải lại đơn hàng sau callback");

            return OrderMapping.MapToDto(updated);
        }

        public async Task<OrderDto> UpdateOrderStatusAsync(
            string orderId,
            UpdateOrderStatusDto dto,
            string? actorUserId = null,
            bool requireMerchantOwnership = false,
            CancellationToken ct = default)
        {
            if (dto.Status == OrderStatus.PaymentSucceeded)
                throw new InvalidOperationException("PaymentSucceeded is a payment event, not a current order status");

            var order = await _orderRepository.GetTrackedByIdWithIncludesAsync(orderId, ct)
                ?? throw new KeyNotFoundException("Order not found");

            if (requireMerchantOwnership)
            {
                await EnsureMerchantCanManageOrderAsync(actorUserId, order, ct);
            }

            if (!IsValidStatusTransition(order.Status, dto.Status))
            {
                throw new InvalidOperationException(
                    $"Cannot change order status from {order.Status} to {dto.Status}.");
            }

            var previousStatus = order.Status;
            var actorRole = requireMerchantOwnership ? Role.Merchant.ToString() : Role.Admin.ToString();
            var shippingDetail = EnsureShippingDetail(order);

            ApplyShippingUpdate(shippingDetail, dto);
            EnsureShippingDataForStatus(shippingDetail, dto.Status);

            order.Status = dto.Status;
            order.Updated = DateTime.UtcNow;

            if (dto.Status == OrderStatus.Delivered && shippingDetail.DeliveredAt == null)
            {
                shippingDetail.DeliveredAt = DateTime.UtcNow;
            }

            order.StatusHistories.Add(CreateStatusHistory(
                order.Id,
                dto.Status,
                actorUserId,
                actorRole,
                dto.Note,
                shippingDetail.CurrentLocation));

            if (ShouldCreateShippingTrackingEvent(dto.Status))
            {
                shippingDetail.TrackingEvents.Add(CreateShippingTrackingEvent(order.Id, shippingDetail, dto.Status, dto.Note));
            }

            await _context.SaveChangesAsync(ct);

            await TryNotifyAsync(
                token => _notificationService.NotifyOrderStatusChangedAsync(orderId, previousStatus, dto.Status, token),
                orderId,
                $"order-status-{dto.Status}",
                ct);

            var updated = await _orderRepository.GetByIdWithIncludesAsync(orderId, ct)
                ?? throw new InvalidOperationException("Cannot reload order after status update");

            return OrderMapping.MapToDto(updated);
        }

        private async Task InvalidateProductCachesAsync(IEnumerable<string> productIds, CancellationToken ct)
        {
            foreach (var productId in productIds)
            {
                await _cache.RemoveAsync(CacheKeys.ProductDetail(productId), ct);
            }

            await _cache.RemoveByPrefixAsync(CacheKeys.ProductListPrefix, ct);
            await _cache.RemoveByPrefixAsync(CacheKeys.ProductSlugPrefix, ct);
            await _cache.RemoveByPrefixAsync(CacheKeys.HomepagePrefix, ct);
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

        private async Task EnsureMerchantCanManageOrderAsync(string? actorUserId, Order order, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(actorUserId))
                throw new ForbiddenAccessException("Merchant account is required");

            var merchantUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == actorUserId, ct)
                ?? throw new ForbiddenAccessException("Merchant account is required");

            if (merchantUser.Role != Role.Merchant || string.IsNullOrWhiteSpace(merchantUser.MerchantId))
                throw new ForbiddenAccessException("Merchant account is required");

            var merchantIds = order.OrderItems
                .Select(i => i.Product?.Brand?.MerchantId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .Distinct()
                .ToList();

            if (merchantIds.Count == 0 || merchantIds.Any(id => id != merchantUser.MerchantId))
                throw new ForbiddenAccessException("You cannot update this order");
        }

        private ShippingDetail EnsureShippingDetail(Order order)
        {
            if (order.ShippingDetail != null)
            {
                order.ShippingDetail.TrackingEvents ??= new List<ShippingTrackingEvent>();
                return order.ShippingDetail;
            }

            var shippingDetail = new ShippingDetail
            {
                Id = Guid.NewGuid().ToString(),
                OrderId = order.Id,
                Method = ShippingMethod.Standard,
                Fee = order.ShippingFee,
                Created = DateTime.UtcNow,
                TrackingEvents = new List<ShippingTrackingEvent>()
            };

            order.ShippingDetail = shippingDetail;
            _context.ShippingDetails.Add(shippingDetail);
            return shippingDetail;
        }

        private static void ApplyShippingUpdate(ShippingDetail shippingDetail, UpdateOrderStatusDto dto)
        {
            var changed = false;

            if (dto.TrackingNumber != null)
            {
                shippingDetail.TrackingNumber = NormalizeOptional(dto.TrackingNumber);
                changed = true;
            }

            if (dto.CarrierName != null)
            {
                shippingDetail.Carrier = NormalizeOptional(dto.CarrierName);
                changed = true;
            }

            if (dto.CarrierCode != null)
            {
                shippingDetail.CarrierCode = NormalizeOptional(dto.CarrierCode);
                changed = true;
            }

            if (dto.CurrentLocation != null)
            {
                shippingDetail.CurrentLocation = NormalizeOptional(dto.CurrentLocation);
                changed = true;
            }

            if (dto.TrackingUrl != null)
            {
                shippingDetail.TrackingUrl = NormalizeOptional(dto.TrackingUrl);
                changed = true;
            }

            if (dto.EstimatedDelivery.HasValue)
            {
                shippingDetail.EstimatedDelivery = dto.EstimatedDelivery.Value;
                changed = true;
            }

            if (changed)
            {
                shippingDetail.Updated = DateTime.UtcNow;
            }
        }

        private static void EnsureShippingDataForStatus(ShippingDetail shippingDetail, OrderStatus status)
        {
            if (!RequiresShippingData(status))
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(shippingDetail.TrackingNumber) ||
                string.IsNullOrWhiteSpace(shippingDetail.Carrier))
            {
                throw new ArgumentException("Tracking number and carrier are required for shipping statuses");
            }
        }

        private static OrderStatusHistory CreateStatusHistory(
            string orderId,
            OrderStatus status,
            string? actorUserId,
            string? actorRole,
            string? note,
            string? location)
        {
            return new OrderStatusHistory
            {
                Id = Guid.NewGuid().ToString(),
                OrderId = orderId,
                Status = status,
                Title = BuildStatusTitle(status),
                Description = BuildStatusDescription(status, note),
                Location = NormalizeOptional(location),
                Note = NormalizeOptional(note),
                ActorUserId = NormalizeOptional(actorUserId),
                ActorRole = NormalizeOptional(actorRole),
                Created = DateTime.UtcNow
            };
        }

        private static ShippingTrackingEvent CreateShippingTrackingEvent(
            string orderId,
            ShippingDetail shippingDetail,
            OrderStatus status,
            string? note)
        {
            return new ShippingTrackingEvent
            {
                Id = Guid.NewGuid().ToString(),
                ShippingDetailId = shippingDetail.Id,
                OrderId = orderId,
                Status = status,
                Title = BuildStatusTitle(status),
                Description = BuildStatusDescription(status, note),
                Location = shippingDetail.CurrentLocation,
                TrackingNumber = shippingDetail.TrackingNumber,
                CarrierName = shippingDetail.Carrier,
                OccurredAt = DateTime.UtcNow,
                Created = DateTime.UtcNow
            };
        }

        private static bool CanCustomerCancel(OrderStatus status) =>
            status is OrderStatus.Pending
                or OrderStatus.OrderPlaced
                or OrderStatus.SellerConfirmed
                or OrderStatus.Packing;

        private static bool IsValidStatusTransition(OrderStatus currentStatus, OrderStatus nextStatus)
        {
            if (currentStatus == nextStatus)
            {
                return true;
            }

            return currentStatus switch
            {
                OrderStatus.Pending => nextStatus is OrderStatus.OrderPlaced or OrderStatus.SellerConfirmed or OrderStatus.Cancelled,
                OrderStatus.Processing => nextStatus is OrderStatus.SellerConfirmed or OrderStatus.Packing or OrderStatus.HandoverToCarrier or OrderStatus.Cancelled,
                OrderStatus.Shipping => nextStatus is OrderStatus.InTransit or OrderStatus.OutForDelivery or OrderStatus.Delivered or OrderStatus.DeliveryFailed or OrderStatus.Completed,
                OrderStatus.OrderPlaced => nextStatus is OrderStatus.SellerConfirmed or OrderStatus.Cancelled,
                OrderStatus.SellerConfirmed => nextStatus is OrderStatus.Packing or OrderStatus.Cancelled,
                OrderStatus.Packing => nextStatus is OrderStatus.HandoverToCarrier or OrderStatus.Cancelled,
                OrderStatus.HandoverToCarrier => nextStatus is OrderStatus.InTransit or OrderStatus.DeliveryFailed,
                OrderStatus.InTransit => nextStatus is OrderStatus.OutForDelivery or OrderStatus.DeliveryFailed,
                OrderStatus.OutForDelivery => nextStatus is OrderStatus.Delivered or OrderStatus.DeliveryFailed,
                OrderStatus.DeliveryFailed => nextStatus is OrderStatus.OutForDelivery or OrderStatus.Returned or OrderStatus.Cancelled,
                OrderStatus.Delivered => nextStatus is OrderStatus.Completed or OrderStatus.ReturnRequested,
                OrderStatus.Completed => nextStatus is OrderStatus.ReturnRequested,
                OrderStatus.ReturnRequested => nextStatus is OrderStatus.ReturnApproved or OrderStatus.ReturnRejected,
                OrderStatus.ReturnRejected => nextStatus is OrderStatus.Delivered or OrderStatus.Completed,
                OrderStatus.ReturnApproved => nextStatus is OrderStatus.Returned,
                OrderStatus.Returned => nextStatus is OrderStatus.Refunded,
                OrderStatus.Cancelled => false,
                OrderStatus.Refunded => false,
                _ => false
            };
        }

        private static bool RequiresShippingData(OrderStatus status) =>
            status is OrderStatus.HandoverToCarrier
                or OrderStatus.InTransit
                or OrderStatus.OutForDelivery
                or OrderStatus.Delivered
                or OrderStatus.DeliveryFailed
                or OrderStatus.Returned;

        private static bool ShouldCreateShippingTrackingEvent(OrderStatus status) =>
            status is OrderStatus.HandoverToCarrier
                or OrderStatus.InTransit
                or OrderStatus.OutForDelivery
                or OrderStatus.Delivered
                or OrderStatus.DeliveryFailed
                or OrderStatus.Returned;

        private static string BuildStatusTitle(OrderStatus status) =>
            status switch
            {
                OrderStatus.Pending => "Cho thanh toan",
                OrderStatus.PaymentSucceeded => "Thanh toan thanh cong",
                OrderStatus.OrderPlaced => "Da dat hang",
                OrderStatus.SellerConfirmed => "Nguoi ban da xac nhan",
                OrderStatus.Packing => "Dang dong goi",
                OrderStatus.HandoverToCarrier => "Da giao cho don vi van chuyen",
                OrderStatus.InTransit => "Dang van chuyen",
                OrderStatus.OutForDelivery => "Dang giao hang",
                OrderStatus.Delivered => "Giao hang thanh cong",
                OrderStatus.Completed => "Hoan tat",
                OrderStatus.DeliveryFailed => "Giao hang that bai",
                OrderStatus.Cancelled => "Da huy don",
                OrderStatus.ReturnRequested => "Yeu cau hoan tra",
                OrderStatus.ReturnApproved => "Da duyet hoan tra",
                OrderStatus.ReturnRejected => "Tu choi hoan tra",
                OrderStatus.Returned => "Da nhan hang hoan tra",
                OrderStatus.Refunded => "Da hoan tien",
                OrderStatus.Processing => "Dang xu ly",
                OrderStatus.Shipping => "Dang giao",
                _ => "Cap nhat don hang"
            };

        private static string BuildStatusDescription(OrderStatus status, string? note)
        {
            if (!string.IsNullOrWhiteSpace(note))
            {
                return note.Trim();
            }

            return status switch
            {
                OrderStatus.Pending => "Don hang dang cho thanh toan hoac xac nhan.",
                OrderStatus.PaymentSucceeded => "Thanh toan da duoc ghi nhan thanh cong.",
                OrderStatus.OrderPlaced => "Don hang da duoc tao va dang cho nguoi ban xac nhan.",
                OrderStatus.SellerConfirmed => "Nguoi ban da xac nhan don hang.",
                OrderStatus.Packing => "Don hang dang duoc dong goi.",
                OrderStatus.HandoverToCarrier => "Don hang da duoc ban giao cho don vi van chuyen.",
                OrderStatus.InTransit => "Kien hang dang di chuyen qua cac buu cuc/kho trung chuyen.",
                OrderStatus.OutForDelivery => "Kien hang dang duoc shipper giao den nguoi nhan.",
                OrderStatus.Delivered => "Kien hang da giao thanh cong.",
                OrderStatus.Completed => "Don hang da hoan tat.",
                OrderStatus.DeliveryFailed => "Don vi van chuyen giao hang khong thanh cong.",
                OrderStatus.Cancelled => "Don hang da bi huy.",
                OrderStatus.ReturnRequested => "Khach hang da gui yeu cau hoan tra.",
                OrderStatus.ReturnApproved => "Yeu cau hoan tra da duoc chap thuan.",
                OrderStatus.ReturnRejected => "Yeu cau hoan tra da bi tu choi.",
                OrderStatus.Returned => "Hang hoan tra da duoc ghi nhan.",
                OrderStatus.Refunded => "Khoan hoan tien da duoc xu ly.",
                OrderStatus.Processing => "Don hang dang duoc xu ly.",
                OrderStatus.Shipping => "Don hang dang duoc van chuyen.",
                _ => "Don hang co cap nhat moi."
            };
        }

        private static string? NormalizeOptional(string? value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private async Task TryNotifyAsync(
            Func<CancellationToken, Task> notify,
            string orderId,
            string action,
            CancellationToken ct)
        {
            try
            {
                await notify(ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Order notification failed. Action={Action}, OrderId={OrderId}", action, orderId);
            }
        }
    }
}
