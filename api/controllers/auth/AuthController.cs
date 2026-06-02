using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using api.common;
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
        private readonly IJwtBlacklistService _jwtBlacklistService;

        public AuthController(
            IAuthService authService,
            ILogger<AuthController> logger,
            IConfiguration configuration,
            IGoogleAuthService googleAuthService,
            IValidator<RegisterDto> registerValidator,
            IValidator<LoginDto> loginValidator,
            IJwtBlacklistService jwtBlacklistService)
        {
            _authService = authService;
            _logger = logger;
            _config = configuration;
            _googleAuthService = googleAuthService;
            _registerValidator = registerValidator;
            _loginValidator = loginValidator;
            _jwtBlacklistService = jwtBlacklistService;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var validationResult = await _registerValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return ValidationProblem(new ValidationProblemDetails(validationResult.ToClientSafeDictionary()));

            var result = await _authService.RegisterAsync(dto);
            if (!result.Succeeded)
                return AuthProblem(result);

            SetAccessTokenCookie(result.Value!.AccessToken);
            SetRefreshTokenCookie(result.Value!.RefreshToken);

            return StatusCode(StatusCodes.Status201Created, result.Value!.User);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var validationResult = await _loginValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return ValidationProblem(new ValidationProblemDetails(validationResult.ToClientSafeDictionary()));

            var result = await _authService.LoginAsync(dto);
            if (!result.Succeeded)
                return AuthProblem(result);

            SetAccessTokenCookie(result.Value!.AccessToken);
            SetRefreshTokenCookie(result.Value!.RefreshToken);

            return Ok(result.Value!.User);
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];

            _logger.LogDebug("Refresh-token request received (hasToken={HasToken})",
                !string.IsNullOrEmpty(refreshToken));

            if (string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("Refresh token not found in cookie");
                return Unauthorized(new ProblemDetails { Status = 401, Title = "Refresh token not found" });
            }

            var result = await _authService.RefreshTokenAsync(refreshToken);
            if (!result.Succeeded)
                return AuthProblem(result);

            SetAccessTokenCookie(result.Value!.AccessToken);
            SetRefreshTokenCookie(result.Value!.RefreshToken);

            return NoContent();
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var result = await _authService.ForgotPasswordAsync(dto.Email);
            if (!result.Succeeded)
                return AuthProblem(result);

            // Always return the same status to avoid user enumeration.
            return NoContent();
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var result = await _authService.ResetPasswordAsync(dto);
            if (!result.Succeeded)
                return AuthProblem(result);

            return NoContent();
        }

        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ProblemDetails { Status = 401, Title = "Unauthorized" });

            var refreshToken = Request.Cookies["refreshToken"];
            if (!string.IsNullOrEmpty(refreshToken))
                await _authService.LogoutAsync(userId, refreshToken);

            var accessToken = GetAccessTokenFromRequest();
            if (!string.IsNullOrWhiteSpace(accessToken))
                await _jwtBlacklistService.BlacklistTokenAsync(accessToken);

            DeleteTokenCookies();

            return NoContent();
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ProblemDetails { Status = 401, Title = "Unauthorized" });

            var result = await _authService.GetCurrentUserAsync(userId);
            if (!result.Succeeded)
                return AuthProblem(result);

            return Ok(result.Value);
        }

        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ProblemDetails { Status = 401, Title = "Unauthorized" });

            var result = await _authService.ChangePasswordAsync(dto, userId);
            if (!result.Succeeded)
                return AuthProblem(result);

            return NoContent();
        }

        [HttpPost("revoke-token")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> RevokeToken()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ProblemDetails { Status = 401, Title = "Unauthorized" });

            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return BadRequest(new ProblemDetails { Status = 400, Title = "Refresh token not found" });

            var result = await _authService.RevokeRefreshTokenAsync(userId, refreshToken);
            if (!result.Succeeded)
                return AuthProblem(result);

            return NoContent();
        }

        // HELPER METHODS

        private IActionResult AuthProblem(AuthResult result) =>
            StatusCode(result.StatusCode, CreateProblemDetails(result.StatusCode, result.Message));

        private IActionResult AuthProblem<T>(AuthResult<T> result) =>
            StatusCode(result.StatusCode, CreateProblemDetails(result.StatusCode, result.Message));

        private ProblemDetails CreateProblemDetails(int statusCode, string message) =>
            new()
            {
                Status = statusCode,
                Title = message,
                Instance = HttpContext.Request.Path,
                Extensions =
                {
                    ["traceId"] = HttpContext.TraceIdentifier
                }
            };

        private void SetAccessTokenCookie(string token)
        {
            var accessTokenExpiration = _config.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 15);
            bool isDev = _config.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development";

            Response.Cookies.Append("accessToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDev,
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
                Secure = !isDev,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(refreshTokenExpiration),
                Path = "/"
            });
        }

        private string? GetAccessTokenFromRequest()
        {
            var token = Request.Cookies["accessToken"];
            if (!string.IsNullOrWhiteSpace(token))
                return token;

            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(authHeader) &&
                authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return authHeader["Bearer ".Length..].Trim();

            return null;
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
