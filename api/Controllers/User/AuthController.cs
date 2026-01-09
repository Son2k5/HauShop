using System.Security.Claims;
using api.DTOs.User;
using api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Services.Interfaces;

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

        /// <summary>
        /// Register a new user account
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid input",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                var result = await _authService.RegisterAsync(registerDto);

                // Set refresh token in HTTP-only cookie
                SetRefreshTokenCookie(result.RefreshToken);

                _logger.LogInformation("User registered successfully: {Email}", registerDto.Email);

                return Ok(new
                {
                    success = true,
                    message = "Registration successful",
                    data = new
                    {
                        accessToken = result.AccessToken,
                        user = result.User
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email: {Email}", registerDto.Email);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}