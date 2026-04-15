using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using api.services.interfaces.auth;
using api.DTOs.user;
using FluentValidation;

namespace api.controllers
{
    [ApiController]
    [Route("api/auth")]
    public partial class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly IConfiguration _config;
        private readonly IGoogleAuthService _googleAuthService;
        private readonly IValidator<RegisterDto> _registerValidator;
        private readonly IValidator<LoginDto> _loginValidator;


        public AuthController(
            IAuthService authService,
            ILogger<AuthController> logger,
            IConfiguration configuration,
             IGoogleAuthService googleAuthService,
             IValidator<RegisterDto> registerValidator,
             IValidator<LoginDto> loginValidator)
        {
            _authService = authService;
            _logger = logger;
            _config = configuration;
            _googleAuthService = googleAuthService;
            _registerValidator = registerValidator;
            _loginValidator = loginValidator;
        }

        // REGISTER - GỬI COOKIE
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var validationResult = await _registerValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    errors = validationResult.ToDictionary()
                });
            }
            var result = await _authService.RegisterAsync(dto);

            SetAccessTokenCookie(result.AccessToken);

            SetRefreshTokenCookie(result.RefreshToken);

            return StatusCode(StatusCodes.Status201Created, new
            {
                message = "Registration successful",
                user = result.User
            });
        }
        // LOGIN - GỬI COOKIE
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var validationResult = await _loginValidator.ValidateAsync(dto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        errors = validationResult.ToDictionary()
                    });
                }
                var result = await _authService.LoginAsync(dto);

                SetAccessTokenCookie(result.AccessToken);

                SetRefreshTokenCookie(result.RefreshToken);

                return Ok(new
                {
                    message = "Login successful",
                    user = result.User
                });
            }
            catch (ArgumentException)
            {
                _logger.LogWarning("Login validation failed for email: {Email}", dto.Email);
                return BadRequest(new { message = "Invalid login request" });
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogWarning("Login failed for email: {Email}", dto.Email);
                return Unauthorized(new { message = "Invalid email or password" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login error");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // REFRESH TOKEN - ĐỌC TỪ COOKIE
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken()
        {
            try
            {
                var refreshToken = Request.Cookies["refreshToken"];

                // Debug: log all cookies
                _logger.LogInformation("Refresh token request. Cookies count: {Count}, Has refreshToken: {HasToken}",
                    Request.Cookies.Count, !string.IsNullOrEmpty(refreshToken));

                if (string.IsNullOrEmpty(refreshToken))
                {
                    _logger.LogWarning("Refresh token not found in cookie");
                    _logger.LogInformation("All cookie names: {CookieNames}",
                        string.Join(", ", Request.Cookies.Select(c => c.Key)));
                    return Unauthorized(new { message = "Refresh token not found" });
                }

                _logger.LogInformation("Refresh token found, length: {Length}", refreshToken.Length);

                var result = await _authService.RefreshTokenAsync(refreshToken);

                SetAccessTokenCookie(result.AccessToken);
                SetRefreshTokenCookie(result.RefreshToken);

                return Ok(new { message = "Token refreshed successfully" });
            }
            catch (ArgumentException)
            {
                _logger.LogWarning("Refresh token validation failed");
                return BadRequest(new { message = "Invalid refresh token request" });
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogWarning("Refresh token unauthorized");
                return Unauthorized(new { message = "Invalid or expired refresh token" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Refresh token error");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // FORGOT PASSWORD - KHÔNG THAY ĐỔI
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            try
            {
                await _authService.ForgotPasswordAsync(dto.Email);
                return Ok(new
                {
                    message = "If the email exists, an OTP has been sent"
                });
            }
            catch (ArgumentException)
            {
                return BadRequest(new { message = "Invalid email" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Forgot password error");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // RESET PASSWORD - KHÔNG THAY ĐỔI
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                await _authService.ResetPasswordAsync(dto);
                return Ok(new { message = "Password reset successfully" });
            }
            catch (ArgumentException)
            {
                return BadRequest(new { message = "Invalid reset password request" });
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogWarning("Reset password failed for email: {Email}", dto.Email);
                return Unauthorized(new { message = "Invalid or expired OTP" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Reset password error");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // LOGOUT - ĐỌC TỪ COOKIE VÀ XÓA

        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? throw new UnauthorizedAccessException();

                var refreshToken = Request.Cookies["refreshToken"];

                if (!string.IsNullOrEmpty(refreshToken))
                {
                    await _authService.LogoutAsync(userId, refreshToken);
                }


                DeleteTokenCookies();

                return Ok(new { message = "Logged out successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Unauthorized" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Logout error");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET CURRENT USER - LẤY THÔNG TIN USER HIỆN TẠI TỪ JWT/COOKIE
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? throw new UnauthorizedAccessException();

                var user = await _authService.GetCurrentUserAsync(userId);

                return Ok(new
                {
                    message = "User found",
                    user = user
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Unauthorized" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get current user error");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // CHANGE PASSWORD - KHÔNG THAY ĐỔI
        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? throw new UnauthorizedAccessException();

                await _authService.ChangePasswordAsync(dto, userId);

                return Ok(new { message = "Password changed successfully" });
            }
            catch (ArgumentException)
            {
                return BadRequest(new { message = "Invalid change password request" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Unauthorized" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Change password error");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // REVOKE TOKEN - ĐỌC TỪ COOKIE

        [HttpPost("revoke-token")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> RevokeToken()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? throw new UnauthorizedAccessException();

                var refreshToken = Request.Cookies["refreshToken"];

                if (string.IsNullOrEmpty(refreshToken))
                {
                    return BadRequest(new { message = "Refresh token not found" });
                }

                await _authService.RevokeRefreshTokenAsync(userId, refreshToken);

                return Ok(new { message = "Token revoked successfully" });
            }
            catch (ArgumentException)
            {
                return BadRequest(new { message = "Invalid revoke token request" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Unauthorized" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Revoke token error");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // HELPER METHODS

        private void SetAccessTokenCookie(string token)
        {
            var accessTokenExpiration = _config.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 15);
            bool isDev = _config.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development";

            Response.Cookies.Append("accessToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDev, // Development: false (HTTP), Production: true (HTTPS)
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddMinutes(accessTokenExpiration),
                Path = "/"
            });
        }

        private void SetRefreshTokenCookie(string token)
        {
            var refreshTokenExpiration = _config.GetValue<int>("Jwt:RefreshTokenExpirationDays", 7);
            bool isDev = _config.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development";

            Response.Cookies.Append("refreshToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDev, // Development: false (HTTP), Production: true (HTTPS)
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(refreshTokenExpiration),
                Path = "/"
            });
        }

        private void DeleteTokenCookies()
        {
            bool isDev = _config.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development";

            Response.Cookies.Delete("accessToken", new CookieOptions
            {
                Path = "/",
                Secure = !isDev,
                SameSite = SameSiteMode.Lax
            });

            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                Path = "/",
                Secure = !isDev,
                SameSite = SameSiteMode.Lax
            });
        }
    }
}