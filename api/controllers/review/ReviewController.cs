using System.Security.Claims;
using api.DTOs.review;
using api.services.interfaces.review;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.review
{
    [ApiController]
    [Route("api/review")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(IReviewService reviewService, ILogger<ReviewController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProductId(
            [FromRoute] string productId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            var result = await _reviewService.GetByProductIdAsync(productId, page, pageSize, ct);
            return Ok(result);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyReviews(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            var result = await _reviewService.GetMyReviewsAsync(userId, page, pageSize, ct);
            return Ok(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateReviewDto dto, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            var result = await _reviewService.CreateAsync(userId, dto, ct);
            return CreatedAtAction(nameof(GetByProductId), new { productId = result.ProductId }, result);
        }

        [HttpGet("pending")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetPending(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            var result = await _reviewService.GetPendingAsync(page, pageSize, ct);
            return Ok(result);
        }

        [HttpPatch("{reviewId}/status")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateStatus(
            [FromRoute] string reviewId,
            [FromBody] UpdateReviewStatusDto dto,
            CancellationToken ct)
        {
            var result = await _reviewService.UpdateStatusAsync(reviewId, dto, ct);
            return Ok(result);
        }

        [HttpDelete("{reviewId}")]
        [Authorize]
        public async Task<IActionResult> Delete([FromRoute] string reviewId, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            var isAdmin = User.IsInRole("Admin");
            await _reviewService.DeleteAsync(reviewId, userId, isAdmin, ct);
            return NoContent();
        }

        private string? TryGetUserId()
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("id") ??
                User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Authenticated request but user id claim was not found.");
                return null;
            }

            return userId;
        }
    }
}
