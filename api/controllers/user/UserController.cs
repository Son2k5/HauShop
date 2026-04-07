using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using api.Data;
using api.services.interfaces.cloud;
using api.Repositories.Interfaces;
using api.Mappings;
using api.DTOs.User;

namespace api.Controllers
{
    /// <summary>
    /// UserController — quản lý thông tin cá nhân và avatar của user đã đăng nhập.
    /// Tất cả endpoint đều yêu cầu [Authorize] (accessToken cookie).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserController> _logger;

        public UserController(
            IUserRepository userRepository,
            ICloudinaryService cloudinaryService,
            ApplicationDbContext context,
            ILogger<UserController> logger)
        {
            _userRepository = userRepository;
            _cloudinaryService = cloudinaryService;
            _context = context;
            _logger = logger;
        }

        // ── GET /api/user/me ──────────────────────────────────────────────────
        /// <summary>
        /// Lấy thông tin user hiện tại từ DB.
        /// Frontend gọi khi mount để đồng bộ data (avatar, tên, ...) với server.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "Unauthorized" });

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(new { user = UserMapper.MapToUserDto(user) });
        }

        // ── POST /api/user/avatar ─────────────────────────────────────────────
        /// <summary>
        /// Upload avatar mới lên Cloudinary.
        /// Tự động xóa avatar cũ trước khi upload để tránh rác trên Cloudinary.
        /// Trả về UserDto đã cập nhật để frontend sync state ngay lập tức.
        /// </summary>
        [HttpPost("avatar")]
        [RequestSizeLimit(10 * 1024 * 1024)] // Giới hạn 10MB ở controller level
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateAvatar(IFormFile file)
        {
            try
            {
                // Debug logging
                var accessToken = Request.Cookies["accessToken"];
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                _logger.LogInformation("Avatar upload - Cookie present: {HasCookie}, AuthHeader present: {HasHeader}",
                    !string.IsNullOrEmpty(accessToken), !string.IsNullOrEmpty(authHeader));

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                    return Unauthorized(new { message = "Unauthorized" });

                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file provided" });

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Xóa avatar cũ trên Cloudinary (nếu có) trước khi upload mới
                // Tránh để lại file rác trên cloud
                if (!string.IsNullOrEmpty(user.AvatarPublicId))
                {
                    var deleted = await _cloudinaryService.DeleteAvatarAsync(user.AvatarPublicId);
                    if (!deleted)
                    {
                        _logger.LogWarning(
                            "Failed to delete old avatar {PublicId} for user {UserId}",
                            user.AvatarPublicId, userId);
                    }
                }

                // Upload ảnh mới — CloudinaryService validate định dạng + kích thước
                var uploadResult = await _cloudinaryService.UploadAvatarAsync(file, userId);

                if (!uploadResult.Success)
                    return BadRequest(new { message = uploadResult.Error ?? "Upload failed" });

                // Cập nhật DB
                user.Avatar = uploadResult.Url;
                user.AvatarPublicId = uploadResult.PublicId;
                user.Updated = DateTime.UtcNow;

                _userRepository.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    avatarUrl = uploadResult.Url,
                    user = UserMapper.MapToUserDto(user)
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar for user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // ── PUT /api/user/profile ─────────────────────────────────────────────
        /// <summary>
        /// Cập nhật thông tin profile của user.
        /// </summary>
        [HttpPut("profile")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                    return Unauthorized(new { message = "Unauthorized" });

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Cập nhật thông tin
                if (!string.IsNullOrWhiteSpace(dto.FirstName))
                    user.FirstName = dto.FirstName.Trim();

                if (!string.IsNullOrWhiteSpace(dto.LastName))
                    user.LastName = dto.LastName.Trim();

                if (dto.PhoneNumber != null)
                    user.PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim();

                user.Updated = DateTime.UtcNow;

                _userRepository.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Profile updated successfully",
                    user = UserMapper.MapToUserDto(user)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile for user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // ── DELETE /api/user/avatar ───────────────────────────────────────────
        /// <summary>
        /// Xóa avatar của user: xóa trên Cloudinary và set null trong DB.
        /// Trả về UserDto đã cập nhật để frontend sync state.
        /// </summary>
        [HttpDelete("avatar")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RemoveAvatar()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                    return Unauthorized(new { message = "Unauthorized" });

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Xóa trên Cloudinary nếu có PublicId
                if (!string.IsNullOrEmpty(user.AvatarPublicId))
                {
                    var deleted = await _cloudinaryService.DeleteAvatarAsync(user.AvatarPublicId);
                    if (!deleted)
                    {
                        _logger.LogWarning(
                            "Failed to delete avatar {PublicId} for user {UserId}",
                            user.AvatarPublicId, userId);
                        // Vẫn tiếp tục xóa trong DB dù Cloudinary fail
                    }
                }

                // Clear trong DB
                user.Avatar = null;
                user.AvatarPublicId = null;
                user.Updated = DateTime.UtcNow;

                _userRepository.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    user = UserMapper.MapToUserDto(user)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing avatar for user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}