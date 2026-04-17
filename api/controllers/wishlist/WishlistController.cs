using System.Security.Claims;
using api.DTOs.wishlist;
using api.services.interfaces.wishlist;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.wishlist
{
    [ApiController]
    [Route("api/wishlist")]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;
        private readonly ILogger<WishlistController> _logger;

        public WishlistController(IWishlistService wishlistService, ILogger<WishlistController> logger)
        {
            _wishlistService = wishlistService;
            _logger = logger;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyWishlist(CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            return Ok(await _wishlistService.GetMyWishlistAsync(userId, ct));
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddWishlistItemDto dto, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            var result = await _wishlistService.AddItemAsync(userId, dto, ct);
            return CreatedAtAction(nameof(GetMyWishlist), new { }, result);
        }

        [HttpDelete("items/{wishlistItemId}")]
        public async Task<IActionResult> RemoveItem(string wishlistItemId, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            await _wishlistService.RemoveItemAsync(userId, wishlistItemId, ct);
            return NoContent();
        }

        [HttpDelete("products/{productId}")]
        public async Task<IActionResult> RemoveProduct(string productId, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            await _wishlistService.RemoveProductAsync(userId, productId, ct);
            return NoContent();
        }

        [HttpGet("products/{productId}/exists")]
        public async Task<IActionResult> Exists(string productId, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            var exists = await _wishlistService.ExistsAsync(userId, productId, ct);
            return Ok(new { exists });
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
