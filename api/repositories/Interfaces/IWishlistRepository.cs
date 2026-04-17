using api.models.entities;

namespace api.repositories.interfaces
{
    public interface IWishlistRepository : IRepository<Wishlist>
    {
        Task<List<Wishlist>> GetByUserIdAsync(string userId, CancellationToken ct = default);
        Task<Wishlist?> GetByUserAndProductAsync(string userId, string productId, CancellationToken ct = default);
        Task<Wishlist?> GetTrackedByIdAsync(string id, CancellationToken ct = default);
        Task<bool> ExistsAsync(string userId, string productId, CancellationToken ct = default);
    }
}
