using api.data;
using api.DTOs.review;
using api.models.entities;
using api.models.enums;
using api.repositories.interfaces;
using api.services.interfaces.review;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.review
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepository;
        private readonly IProductRepository _productRepository;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(
            IReviewRepository reviewRepository,
            IProductRepository productRepository,
            ApplicationDbContext context,
            ILogger<ReviewService> logger)
        {
            _reviewRepository = reviewRepository;
            _productRepository = productRepository;
            _context = context;
            _logger = logger;
        }

        public async Task<ReviewDto> CreateAsync(string userId, CreateReviewDto dto, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.ProductId))
                throw new InvalidOperationException("ProductId là bắt buộc");

            if (dto.Rating < 1 || dto.Rating > 5)
                throw new InvalidOperationException("Rating phải từ 1 đến 5");

            var product = await _productRepository.GetByIdAsync(dto.ProductId, ct)
                ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm: {dto.ProductId}");

            if (!product.IsActive)
                throw new InvalidOperationException("Sản phẩm không còn khả dụng");

            var alreadyReviewed = await _reviewRepository.ExistsByUserAndProductAsync(userId, dto.ProductId, ct);
            if (alreadyReviewed)
                throw new InvalidOperationException("Bạn đã đánh giá sản phẩm này");

            var review = new Review
            {
                Id = Guid.NewGuid().ToString(),
                ProductId = dto.ProductId,
                UserId = userId,
                Rating = dto.Rating,
                Content = string.IsNullOrWhiteSpace(dto.Content) ? null : dto.Content.Trim(),
                Status = ReviewStatus.Approved,
                Created = DateTime.UtcNow
            };

            _reviewRepository.Add(review);
            await _context.SaveChangesAsync(ct);
            await _productRepository.UpdateProductRatingAsync(dto.ProductId, ct);

            var created = await _reviewRepository.GetTrackedWithIncludesAsync(review.Id, ct)
                ?? throw new InvalidOperationException("Không thể tải lại review sau khi tạo");

            _logger.LogInformation(
                "Review created. ReviewId={ReviewId}, UserId={UserId}, ProductId={ProductId}, Rating={Rating}",
                review.Id,
                userId,
                dto.ProductId,
                dto.Rating);

            return MapToDto(created);
        }

        public async Task<PagedReviewDto> GetByProductIdAsync(
            string productId,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            var (items, total) = await _reviewRepository.GetApprovedByProductIdAsync(productId, page, pageSize, ct);

            return new PagedReviewDto
            {
                Items = items.Select(MapToDto).ToList(),
                Total = total,
                Page = Math.Max(page, 1),
                PageSize = Math.Clamp(pageSize, 1, 100)
            };
        }

        public async Task<PagedReviewDto> GetMyReviewsAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            var (items, total) = await _reviewRepository.GetByUserIdAsync(userId, page, pageSize, ct);

            return new PagedReviewDto
            {
                Items = items.Select(MapToDto).ToList(),
                Total = total,
                Page = Math.Max(page, 1),
                PageSize = Math.Clamp(pageSize, 1, 100)
            };
        }

        public async Task<PagedReviewDto> GetPendingAsync(
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            var (items, total) = await _reviewRepository.GetPendingAsync(page, pageSize, ct);

            return new PagedReviewDto
            {
                Items = items.Select(MapToDto).ToList(),
                Total = total,
                Page = Math.Max(page, 1),
                PageSize = Math.Clamp(pageSize, 1, 100)
            };
        }

        public async Task<ReviewDto> UpdateStatusAsync(
            string reviewId,
            UpdateReviewStatusDto dto,
            CancellationToken ct = default)
        {
            var review = await _reviewRepository.GetTrackedWithIncludesAsync(reviewId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy review");

            review.Status = dto.Status;
            review.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            await _productRepository.UpdateProductRatingAsync(review.ProductId, ct);

            _logger.LogInformation(
                "Review status updated. ReviewId={ReviewId}, ProductId={ProductId}, Status={Status}",
                review.Id,
                review.ProductId,
                review.Status);

            return MapToDto(review);
        }

        public async Task DeleteAsync(
            string reviewId,
            string userId,
            bool isAdmin,
            CancellationToken ct = default)
        {
            var review = await _reviewRepository.GetTrackedWithIncludesAsync(reviewId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy review");

            if (!isAdmin && review.UserId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa review này");

            var productId = review.ProductId;

            _reviewRepository.Delete(review);
            await _context.SaveChangesAsync(ct);
            await _productRepository.UpdateProductRatingAsync(productId, ct);

            _logger.LogInformation(
                "Review deleted. ReviewId={ReviewId}, ProductId={ProductId}, UserId={UserId}, IsAdmin={IsAdmin}",
                reviewId,
                productId,
                userId,
                isAdmin);
        }

        private static ReviewDto MapToDto(Review review)
        {
            var firstName = review.User?.FirstName ?? string.Empty;
            var lastName = review.User?.LastName ?? string.Empty;
            var userName = $"{firstName} {lastName}".Trim();

            return new ReviewDto
            {
                Id = review.Id,
                ProductId = review.ProductId,
                ProductName = review.Product?.Name ?? string.Empty,
                UserId = review.UserId,
                UserName = string.IsNullOrWhiteSpace(userName) ? "Người dùng" : userName,
                UserAvatar = review.User?.Avatar,
                Rating = review.Rating,
                Content = review.Content,
                Status = review.Status,
                Created = review.Created,
                Updated = review.Updated
            };
        }
    }
}
