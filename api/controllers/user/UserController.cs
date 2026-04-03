using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using api.Services.Interfaces;
using api.services.interfaces.user;

namespace api.Controllers.User
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(
            IUserService userService,
            ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            try
            {
                var user = await _userService.GetCurrentUserAsync(userId);
                return Ok(new { success = true, user });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UpdateAvatar([FromForm] IFormFile file)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            try
            {
                var user = await _userService.UpdateAvatarAsync(userId, file);

                return Ok(new
                {
                    success = true,
                    avatarUrl = user.Avatar,
                    user,
                    message = "Avatar updated successfully"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("avatar")]
        public async Task<IActionResult> RemoveAvatar()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            try
            {
                var user = await _userService.RemoveAvatarAsync(userId);

                return Ok(new
                {
                    success = true,
                    user,
                    message = "Avatar removed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing avatar");
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}