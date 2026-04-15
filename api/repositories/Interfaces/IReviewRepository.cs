using api.models.entities;

namespace api.repositories.interfaces
{
    public interface IReviewRepository : IRepository<Review>
    {
        Task<(List<Review> Items, int Total)> GetApprovedByProductIdAsync(
            string productId,
            int page,
            int pageSize,
            CancellationToken ct = default);

        Task<(List<Review> Items, int Total)> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default);

        Task<(List<Review> Items, int Total)> GetPendingAsync(
            int page,
            int pageSize,
            CancellationToken ct = default);

        Task<bool> ExistsByUserAndProductAsync(
            string userId,
            string productId,
            CancellationToken ct = default);

        Task<Review?> GetTrackedWithIncludesAsync(string reviewId, CancellationToken ct = default);

        Task<Review?> GetByUserAndProductAsync(
            string userId,
            string productId,
            CancellationToken ct = default);
    }
}