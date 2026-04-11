using System.Security.Claims;
using api.DTOs.cart;
using api.services.interfaces.cart;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.cart
{
    [ApiController]
    [Route("api/cart")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly ILogger<CartController> _logger;

        public CartController(
            ICartService cartService,
            ILogger<CartController> logger)
        {
            _cartService = cartService;
            _logger = logger;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyCart(CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được người dùng." });

            var result = await _cartService.GetMyCartAsync(userId, ct);
            return Ok(result);
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItem(
            [FromBody] AddCartItemDto dto,
            CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được người dùng." });

            var result = await _cartService.AddItemAsync(userId, dto, ct);

            return CreatedAtAction(
                nameof(GetMyCart),
                new { },
                result);
        }

        [HttpPut("items/{cartItemId}")]
        public async Task<IActionResult> UpdateItemQuantity(
            [FromRoute] string cartItemId,
            [FromBody] UpdateCartItemDto dto,
            CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được người dùng." });

            var result = await _cartService.UpdateItemQuantityAsync(userId, cartItemId, dto, ct);
            return Ok(result);
        }

        [HttpDelete("items/{cartItemId}")]
        public async Task<IActionResult> RemoveItem(
            [FromRoute] string cartItemId,
            CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được người dùng." });

            var result = await _cartService.RemoveItemAsync(userId, cartItemId, ct);
            return Ok(result);
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart(CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được người dùng." });

            var result = await _cartService.ClearCartAsync(userId, ct);
            return Ok(result);
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