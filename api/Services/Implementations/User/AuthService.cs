using api.Data;
using api.Helpers;
using api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using api.DTOs.User;
using api.Models.Enum;
using api.Models.Entities;
using api.Mappings;
using api.Services.Interfaces;
using api.Repositories.Interfaces;

namespace api.Services.Implementations.User
{

    public class AuthService : IAuthService
    {
        public readonly ApplicationDbContext _context;
        public readonly ITokenService _tokenService;
        public readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUserRepository _userRepository;


        public AuthService(
            ApplicationDbContext context,
            ITokenService tokenService,
            IEmailService emailService,
            IConfiguration config,
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository)
        {
            _config = config;
            _context = context;
            _emailService = emailService;
            _tokenService = tokenService;
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(e => e.Email == registerDto.Email);

            if (existingUser != null)
            {
                throw new Exception("Email already exists");
            }
            if (string.IsNullOrWhiteSpace(registerDto.Email))
            {
                throw new ArgumentException("Email is required");
            }
            if (string.IsNullOrWhiteSpace(registerDto.Password))
            {
                throw new ArgumentException("Password is required");
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
                Token = refreshTokenString,
                UserId = user.Id,
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddDays(_config.GetValue<int>("Jwt:RefreshTokenExpirationDays"))

            };

            _userRepository.Add(user);
            _refreshTokenRepository.Add(refreshToken);
            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenString,
                User = UserMapper.MapToUserDto(user)

            };



        }
        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            if (string.IsNullOrWhiteSpace(loginDto.Email))
            {
                throw new ArgumentException("Email is required");
            }
            if (string.IsNullOrWhiteSpace(loginDto.Password))
            {
                throw new ArgumentException("Password is required");
            }
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }
            if(!PasswordHasher.Verify(loginDto.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshTokenString = _tokenService.GenerateRefreshToken();
            await CleanupUser
        }


    }
}