using System.Security.Claims;
using api.DTOs.User;
using api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using api.Services.Implementations.User;
using Org.BouncyCastle.Ocsp;

namespace api.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }
        [HttpPost("register")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                var reponse = await _authService.RegisterAsync(registerDto);
                SetRefreshTokenCookie(reponse.RefreshToken);
                return Ok(new
                {
                    success = true,
                    message = "Registration Successful",
                    data = new
                    {
                        accessToken = reponse.AccessToken,
                        user = reponse.User
                    }
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error during registration: {Email}", registerDto.Email);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Email already exists: {Email}", registerDto.Email);
                return Conflict(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during registration for email: {Email}", registerDto.Email);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred during registration. Please try again later."
                });
            }
        }
        [HttpPost("login")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var response = await _authService.LoginAsync(loginDto);
                SetRefreshTokenCookie(response.RefreshToken);

                return Ok(
                    new
                    {
                        success = true,
                        message = "Login successful",
                        data = new
                        {
                            accessToken = response.AccessToken,
                            user = response.User
                        }
                    }
                );
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error during login");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Failed login attempt for: {Email}", loginDto.Email);
                return Unauthorized(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during login for: {Email}", loginDto.Email);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred during login. Please try again later."
                });
            }


        }
        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7),
                Path = "/",
                IsEssential = true
            };
            if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"))
                && Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                cookieOptions.Secure = false;
            }

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}