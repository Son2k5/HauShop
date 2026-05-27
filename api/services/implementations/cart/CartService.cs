using api.data;
using api.DTOs.cart;
using api.models.entities;
using api.repositories.interfaces;
using api.services.interfaces.cart;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.cart
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IProductVariantRepository _productVariantRepository;
        private readonly ICartCacheService _cartCache;
        private readonly ApplicationDbContext _dbContext;
        private readonly ILogger<CartService> _logger;

        public CartService(
            ICartRepository cartRepository,
            IProductVariantRepository productVariantRepository,
            ICartCacheService cartCache,
            ApplicationDbContext dbContext,
            ILogger<CartService> logger)
        {
            _cartRepository = cartRepository;
            _productVariantRepository = productVariantRepository;
            _cartCache = cartCache;
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<CartDto> GetMyCartAsync(string userId, CancellationToken ct = default)
        {
            var cachedCart = await _cartCache.GetUserCartAsync(userId, ct);
            if (cachedCart != null)
                return cachedCart;

            var cart = await EnsureCartExistsAsync(userId, ct);
            return await LoadAndCacheCartAsync(userId, cart.Id, ct);
        }

        public async Task<CartDto> AddItemAsync(string userId, AddCartItemDto dto, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.ProductVariantId))
                throw new InvalidOperationException("ProductVariantId is required");

            if (dto.Quantity <= 0)
                throw new InvalidOperationException("Quantity must be greater than zero");

            var cart = await EnsureCartExistsAsync(userId, ct);

            var variant = await _productVariantRepository.GetActiveByIdAsync(dto.ProductVariantId, ct)
                ?? throw new KeyNotFoundException("Product variant was not found or is inactive");

            if (variant.Product == null || !variant.Product.IsActive)
                throw new InvalidOperationException("Product is not available");

            if (variant.Stock <= 0)
                throw new InvalidOperationException("Product variant is out of stock");

            var existingItem = await _cartRepository.GetTrackedCartItemByVariantAsync(cart.Id, variant.Id, ct);

            if (existingItem != null)
            {
                var newQuantity = existingItem.Quantity + dto.Quantity;
                EnsureStockIsEnough(newQuantity, variant.Stock);

                existingItem.Quantity = newQuantity;
                existingItem.Price = variant.Price;
            }
            else
            {
                EnsureStockIsEnough(dto.Quantity, variant.Stock);

                _cartRepository.AddCartItem(new CartItem
                {
                    Id = Guid.NewGuid().ToString(),
                    CartId = cart.Id,
                    ProductId = variant.ProductId,
                    ProductVariantId = variant.Id,
                    Quantity = dto.Quantity,
                    Price = variant.Price,
                    Created = DateTime.UtcNow
                });
            }

            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Added item to cart. UserId={UserId}, CartId={CartId}, VariantId={VariantId}, Quantity={Quantity}",
                userId, cart.Id, variant.Id, dto.Quantity);

            return await LoadAndCacheCartAsync(userId, cart.Id, ct);
        }

        public async Task<CartDto> IncreaseItemQuantityAsync(
            string userId,
            string cartItemId,
            int quantity = 1,
            CancellationToken ct = default)
        {
            if (quantity <= 0)
                throw new InvalidOperationException("Quantity increment must be greater than zero");

            var item = await GetUserCartItemAsync(userId, cartItemId, ct)
                ?? throw new KeyNotFoundException("Cart item was not found");

            return await UpdateItemQuantityAsync(
                userId,
                cartItemId,
                new UpdateCartItemDto { Quantity = item.Quantity + quantity },
                ct);
        }

        public async Task<CartDto> UpdateItemQuantityAsync(
            string userId,
            string cartItemId,
            UpdateCartItemDto dto,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(cartItemId))
                throw new InvalidOperationException("CartItemId is invalid");

            if (dto.Quantity <= 0)
                throw new InvalidOperationException("Quantity must be greater than zero");

            var item = await GetUserCartItemAsync(userId, cartItemId, ct)
                ?? throw new KeyNotFoundException("Cart item was not found");

            if (item.Product == null || !item.Product.IsActive)
                throw new InvalidOperationException("Product is not available");

            if (item.ProductVariant == null || !item.ProductVariant.IsActive)
                throw new InvalidOperationException("Product variant is not available");

            EnsureStockIsEnough(dto.Quantity, item.ProductVariant.Stock);

            item.Quantity = dto.Quantity;
            item.Price = item.ProductVariant.Price;

            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Updated cart item quantity. UserId={UserId}, CartItemId={CartItemId}, Quantity={Quantity}",
                userId, cartItemId, dto.Quantity);

            return await LoadAndCacheCartAsync(userId, item.CartId, ct);
        }

        public async Task<CartDto> RemoveItemAsync(string userId, string cartItemId, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(cartItemId))
                throw new InvalidOperationException("CartItemId is invalid");

            var item = await GetUserCartItemAsync(userId, cartItemId, ct);
            if (item == null)
            {
                var currentCart = await EnsureCartExistsAsync(userId, ct);
                _logger.LogInformation(
                    "Skipped removing cart item because it was not in the user's cart. UserId={UserId}, CartItemId={CartItemId}",
                    userId, cartItemId);

                return await LoadAndCacheCartAsync(userId, currentCart.Id, ct);
            }

            var cartId = item.CartId;

            _cartRepository.RemoveCartItem(item);
            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Removed cart item. UserId={UserId}, CartItemId={CartItemId}",
                userId, cartItemId);

            return await LoadAndCacheCartAsync(userId, cartId, ct);
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

            _logger.LogInformation("Cleared cart. UserId={UserId}, CartId={CartId}", userId, cart.Id);

            return await LoadAndCacheCartAsync(userId, cart.Id, ct);
        }

        public async Task<CartDto> MergeGuestCartAsync(
            string userId,
            MergeGuestCartDto dto,
            CancellationToken ct = default)
        {
            foreach (var item in dto.Items.Where(item =>
                         !string.IsNullOrWhiteSpace(item.ProductVariantId) && item.Quantity > 0))
            {
                await AddItemAsync(
                    userId,
                    new AddCartItemDto
                    {
                        ProductVariantId = item.ProductVariantId,
                        Quantity = item.Quantity
                    },
                    ct);
            }

            return await GetMyCartAsync(userId, ct);
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
            await _cartCache.RemoveUserCartAsync(userId, ct);

            _logger.LogInformation("Created cart for user. UserId={UserId}, CartId={CartId}", userId, cart.Id);

            return cart;
        }

        private Task<CartItem?> GetUserCartItemAsync(
            string userId,
            string cartItemId,
            CancellationToken ct)
        {
            return _dbContext.Set<CartItem>()
                .Include(i => i.Cart)
                .Include(i => i.Product)
                .Include(i => i.ProductVariant)
                .FirstOrDefaultAsync(
                    i => i.Id == cartItemId && i.Cart.UserId == userId,
                    ct);
        }

        private async Task<CartDto> LoadAndCacheCartAsync(string userId, string cartId, CancellationToken ct)
        {
            var cart = await _cartRepository.GetByIdWithItemsAsync(cartId, ct)
                ?? throw new KeyNotFoundException("Cart was not found");

            var result = MapCartToDto(cart);
            await _cartCache.SetUserCartAsync(userId, result, ct);
            return result;
        }

        private static void EnsureStockIsEnough(int requestedQuantity, int stock)
        {
            if (requestedQuantity > stock)
                throw new InvalidOperationException($"Quantity exceeds available stock. Current stock: {stock}");
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
