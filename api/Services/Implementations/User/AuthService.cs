using api.Data;
using api.Helpers;
using api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using api.DTOs.User;
using api.Models.Enum;
using api.Models.Entities;
using api.Mappings;
using api.Services.Interfaces;

namespace api.Services.Implememtation.User
{

    public class AuthService : IAuthService
    {
        public readonly ApplicationDbContext _context;
        public readonly ITokenService _tokenService;
        public readonly IEmailService _emailService;
        private readonly IConfiguration _config;

        public AuthService(
            ApplicationDbContext context,
            ITokenService tokenService,
            IEmailService emailService,
            IConfiguration config)
        {
            _config = config;
            _context = context;
            _emailService = emailService;
            _tokenService = tokenService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(e => e.Email == registerDto.Email);

            if (existingUser != null)
            {
                throw new Exception("Email already exists");
            }
            var passwordHash = PasswordHasher.Hash(registerDto.Password);

            var user = new Models.Entities.User
            {
                Id = Guid.NewGuid().ToString(),
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                PhoneNumber = registerDto.PhoneNumber,
                PasswordHash = passwordHash,
                Provider = Provider.Local,
                GoogleId = string.Empty,
                FacebookId = string.Empty,
                Avatar = string.Empty,
                Role = Role.Member,
                ResetPasswordToken = string.Empty,
                IsOnline = false,
                Created = DateTime.UtcNow
            };
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshTokenString = _tokenService.GenerateRefreshToken();

            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid().ToString(),
                UserId = user.Id,
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddDays(_config.GetValue<int>("Jwt:RefreshTokenExpirationDays"))

            };

            user.RefreshTokens.Add(refreshToken);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenString,
                User = UserMapper.MapToUserDto(user)

            };



        }


    }
}