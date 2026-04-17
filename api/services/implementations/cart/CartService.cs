using api.data;
using api.DTOs.cart;
using api.models.entities;
using api.repositories.interfaces;
using api.services.interfaces.cart;
using Microsoft.EntityFrameworkCore;
using System.Threading;

namespace api.services.implementations.cart
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IProductVariantRepository _productVariantRepository;
        private readonly ApplicationDbContext _dbContext;
        private readonly ILogger<CartService> _logger;

        public CartService(
            ICartRepository cartRepository,
            IProductVariantRepository productVariantRepository,
            ApplicationDbContext dbContext,
            ILogger<CartService> logger)
        {
            _cartRepository = cartRepository;
            _productVariantRepository = productVariantRepository;
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<CartDto> GetMyCartAsync(string userId, CancellationToken ct = default)
        {
            var cart = await EnsureCartExistsAsync(userId, ct);

            var fullCart = await _cartRepository.GetByIdWithItemsAsync(cart.Id, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy giỏ hàng");

            return MapCartToDto(fullCart);
        }

        public async Task<CartDto> AddItemAsync(string userId, AddCartItemDto dto, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.ProductVariantId))
                throw new InvalidOperationException("ProductVariantId là bắt buộc");

            if (dto.Quantity <= 0)
                throw new InvalidOperationException("Quantity phải lớn hơn 0");

            var cart = await EnsureCartExistsAsync(userId, ct);

            var variant = await _productVariantRepository.GetActiveByIdAsync(dto.ProductVariantId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy biến thể sản phẩm hoặc biến thể đã bị vô hiệu hóa");

            if (variant.Product == null || !variant.Product.IsActive)
                throw new InvalidOperationException("Sản phẩm không còn khả dụng");

            if (variant.Stock <= 0)
                throw new InvalidOperationException("Biến thể sản phẩm đã hết hàng");

            var existingItem = await _cartRepository.GetTrackedCartItemByVariantAsync(cart.Id, variant.Id, ct);

            if (existingItem != null)
            {
                var newQuantity = existingItem.Quantity + dto.Quantity;

                if (newQuantity > variant.Stock)
                    throw new InvalidOperationException($"Số lượng vượt quá tồn kho. Tồn hiện tại: {variant.Stock}");

                existingItem.Quantity = newQuantity;
                existingItem.Price = variant.Price;
            }
            else
            {
                if (dto.Quantity > variant.Stock)
                    throw new InvalidOperationException($"Số lượng vượt quá tồn kho. Tồn hiện tại: {variant.Stock}");

                var cartItem = new CartItem
                {
                    Id = Guid.NewGuid().ToString(),
                    CartId = cart.Id,
                    ProductId = variant.ProductId,
                    ProductVariantId = variant.Id,
                    Quantity = dto.Quantity,
                    Price = variant.Price,
                    Created = DateTime.UtcNow
                };

                _cartRepository.AddCartItem(cartItem);
            }

            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Added item to cart. UserId={UserId}, CartId={CartId}, VariantId={VariantId}, Quantity={Quantity}",
                userId, cart.Id, variant.Id, dto.Quantity);

            var updatedCart = await _cartRepository.GetByIdWithItemsAsync(cart.Id, ct)
                ?? throw new InvalidOperationException("Không thể tải lại giỏ hàng sau khi thêm sản phẩm");

            return MapCartToDto(updatedCart);
        }

        public async Task<CartDto> UpdateItemQuantityAsync(string userId, string cartItemId, UpdateCartItemDto dto, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(cartItemId))
                throw new InvalidOperationException("CartItemId không hợp lệ");

            if (dto.Quantity <= 0)
                throw new InvalidOperationException("Quantity phải lớn hơn 0");

            var item = await _cartRepository.GetTrackedCartItemByIdAsync(cartItemId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy cart item");

            if (item.Cart == null || item.Cart.UserId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật cart item này");

            if (item.Product == null || !item.Product.IsActive)
                throw new InvalidOperationException("Sản phẩm không còn khả dụng");

            if (item.ProductVariant == null || !item.ProductVariant.IsActive)
                throw new InvalidOperationException("Biến thể sản phẩm không còn khả dụng");

            if (dto.Quantity > item.ProductVariant.Stock)
                throw new InvalidOperationException($"Số lượng vượt quá tồn kho. Tồn hiện tại: {item.ProductVariant.Stock}");

            item.Quantity = dto.Quantity;
            item.Price = item.ProductVariant.Price;

            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Updated cart item quantity. UserId={UserId}, CartItemId={CartItemId}, Quantity={Quantity}",
                userId, cartItemId, dto.Quantity);

            var updatedCart = await _cartRepository.GetByIdWithItemsAsync(item.CartId, ct)
                ?? throw new InvalidOperationException("Không thể tải lại giỏ hàng sau khi cập nhật");

            return MapCartToDto(updatedCart);
        }

        public async Task<CartDto> RemoveItemAsync(string userId, string cartItemId, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(cartItemId))
                throw new InvalidOperationException("CartItemId không hợp lệ");

            var item = await _cartRepository.GetTrackedCartItemByIdAsync(cartItemId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy cart item");

            if (item.Cart == null || item.Cart.UserId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa cart item này");

            var cartId = item.CartId;

            _cartRepository.RemoveCartItem(item);
            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Removed cart item. UserId={UserId}, CartItemId={CartItemId}",
                userId, cartItemId);

            var updatedCart = await _cartRepository.GetByIdWithItemsAsync(cartId, ct)
                ?? throw new InvalidOperationException("Không thể tải lại giỏ hàng sau khi xóa sản phẩm");

            return MapCartToDto(updatedCart);
        }

        public async Task<CartDto> ClearCartAsync(string userId, CancellationToken ct = default)
        {
            var cart = await EnsureCartExistsAsync(userId, ct);

            var items = await _cartRepository.GetTrackedItemsByCartIdAsync(cart.Id, ct);

            if (items.Count > 0)
            {
                _cartRepository.RemoveCartItems(items);
                await _dbContext.SaveChangesAsync(ct);
            }

            _logger.LogInformation(
                "Cleared cart. UserId={UserId}, CartId={CartId}",
                userId, cart.Id);

            var updatedCart = await _cartRepository.GetByIdWithItemsAsync(cart.Id, ct)
                ?? throw new InvalidOperationException("Không thể tải lại giỏ hàng sau khi clear");

            return MapCartToDto(updatedCart);
        }

        private async Task<Cart> EnsureCartExistsAsync(string userId, CancellationToken ct)
        {
            var cart = await _cartRepository.FirstOrDefaultAsync(c => c.UserId == userId, ct);
            if (cart != null)
                return cart;

            cart = new Cart
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Created = DateTime.UtcNow,
                Items = new List<CartItem>()
            };

            _cartRepository.Add(cart);
            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation("Created cart for user. UserId={UserId}, CartId={CartId}", userId, cart.Id);

            return cart;
        }

        private static CartDto MapCartToDto(Cart cart)
        {
            return new CartDto
            {
                Id = cart.Id,
                UserId = cart.UserId,
                Created = cart.Created,
                Items = cart.Items?
                    .OrderByDescending(i => i.Created)
                    .Select(i => new CartItemDto
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ProductName = i.Product?.Name ?? string.Empty,
                        ProductSlug = i.Product?.Slug ?? string.Empty,
                        ProductImageUrl = i.Product?.ImageUrl,

                        ProductVariantId = i.ProductVariantId,
                        VariantSku = i.ProductVariant?.Sku,
                        VariantSize = i.ProductVariant?.Size,
                        VariantColor = i.ProductVariant?.Color,
                        VariantImageUrl = i.ProductVariant?.ImageUrl,

                        UnitPrice = i.Price,
                        Quantity = i.Quantity,
                        AvailableStock = i.ProductVariant?.Stock ?? 0,
                        Created = i.Created
                    })
                    .ToList() ?? new List<CartItemDto>()
            };
        }
    }
}