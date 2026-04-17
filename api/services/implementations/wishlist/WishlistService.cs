using api.data;
using api.DTOs.wishlist;
using api.mappings;
using api.models.entities;
using api.repositories.interfaces;
using api.services.interfaces.wishlist;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.wishlist
{
    public class WishlistService : IWishlistService
    {
        private readonly IWishlistRepository _wishlistRepository;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WishlistService> _logger;

        public WishlistService(
            IWishlistRepository wishlistRepository,
            ApplicationDbContext context,
            ILogger<WishlistService> logger)
        {
            _wishlistRepository = wishlistRepository;
            _context = context;
            _logger = logger;
        }

        public async Task<List<WishlistItemDto>> GetMyWishlistAsync(
            string userId,
            CancellationToken ct = default)
        {
            var items = await _wishlistRepository.GetByUserIdAsync(userId, ct);

            _logger.LogInformation(
                "Loaded wishlist. UserId={UserId}, Count={Count}",
                userId,
                items.Count);

            return items.Select(WishlistMapping.MapToDto).ToList();
        }

        public async Task<WishlistItemDto> AddItemAsync(
            string userId,
            AddWishlistItemDto dto,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.ProductId))
                throw new InvalidOperationException("ProductId is required");

            var existing = await _wishlistRepository.GetByUserAndProductAsync(userId, dto.ProductId, ct);
            if (existing != null)
            {
                _logger.LogInformation(
                    "Wishlist item already exists. UserId={UserId}, ProductId={ProductId}",
                    userId,
                    dto.ProductId);

                return WishlistMapping.MapToDto(existing);
            }

            var productExists = await _context.Products
                .AsNoTracking()
                .AnyAsync(p => p.Id == dto.ProductId && p.IsActive, ct);

            if (!productExists)
                throw new KeyNotFoundException($"Khong tim thay san pham: {dto.ProductId}");

            var item = new Wishlist
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                ProductId = dto.ProductId,
                Created = DateTime.UtcNow,
            };

            _wishlistRepository.Add(item);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Wishlist item added. UserId={UserId}, ProductId={ProductId}, WishlistItemId={WishlistItemId}",
                userId,
                dto.ProductId,
                item.Id);

            var created = await _wishlistRepository.GetByUserAndProductAsync(userId, dto.ProductId, ct)
                ?? throw new InvalidOperationException("Failed to retrieve created wishlist item");

            return WishlistMapping.MapToDto(created);
        }

        public async Task RemoveItemAsync(
            string userId,
            string wishlistItemId,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(wishlistItemId))
                throw new InvalidOperationException("WishlistItemId is invalid");

            var item = await _wishlistRepository.GetTrackedByIdAsync(wishlistItemId, ct)
                ?? throw new KeyNotFoundException($"Khong tim thay wishlist item: {wishlistItemId}");

            if (item.UserId != userId)
                throw new UnauthorizedAccessException("Ban khong co quyen xoa wishlist item nay");

            _wishlistRepository.Delete(item);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Wishlist item removed. UserId={UserId}, WishlistItemId={WishlistItemId}, ProductId={ProductId}",
                userId,
                wishlistItemId,
                item.ProductId);
        }

        public async Task RemoveProductAsync(
            string userId,
            string productId,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(productId))
                throw new InvalidOperationException("ProductId is invalid");

            var item = await _wishlistRepository.GetByUserAndProductAsync(userId, productId, ct)
                ?? throw new KeyNotFoundException($"Khong tim thay san pham trong wishlist: {productId}");

            _wishlistRepository.Delete(item);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Wishlist product removed. UserId={UserId}, ProductId={ProductId}, WishlistItemId={WishlistItemId}",
                userId,
                productId,
                item.Id);
        }

        public Task<bool> ExistsAsync(
            string userId,
            string productId,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(productId))
                throw new InvalidOperationException("ProductId is invalid");

            return _wishlistRepository.ExistsAsync(userId, productId, ct);
        }
    }
}
