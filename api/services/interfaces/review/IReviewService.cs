using api.DTOs.review;

namespace api.services.interfaces.review
{
    public interface IReviewService
    {
        Task<ReviewDto> CreateAsync(string userId, CreateReviewDto dto, CancellationToken ct = default);

        Task<PagedReviewDto> GetByProductIdAsync(
            string productId,
            int page,
            int pageSize,
            CancellationToken ct = default);

        Task<PagedReviewDto> GetMyReviewsAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default);

        Task<PagedReviewDto> GetPendingAsync(
            int page,
            int pageSize,
            CancellationToken ct = default);

        Task<ReviewDto> UpdateStatusAsync(
            string reviewId,
            UpdateReviewStatusDto dto,
            CancellationToken ct = default);

        Task DeleteAsync(
            string reviewId,
            string userId,
            bool isAdmin,
            CancellationToken ct = default);
    }
}