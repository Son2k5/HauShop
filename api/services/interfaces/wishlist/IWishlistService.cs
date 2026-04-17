using api.DTOs.wishlist;

namespace api.services.interfaces.wishlist
{
    public interface IWishlistService
    {
        Task<List<WishlistItemDto>> GetMyWishlistAsync(string userId, CancellationToken ct = default);
        Task<WishlistItemDto> AddItemAsync(string userId, AddWishlistItemDto dto, CancellationToken ct = default);
        Task RemoveItemAsync(string userId, string wishlistItemId, CancellationToken ct = default);
        Task RemoveProductAsync(string userId, string productId, CancellationToken ct = default);
        Task<bool> ExistsAsync(string userId, string productId, CancellationToken ct = default);
    }
}
