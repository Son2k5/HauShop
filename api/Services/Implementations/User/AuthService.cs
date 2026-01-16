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
        private readonly int MAX_REFRESH_TOKENS_PER_USER = 5;


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
                Token = HashRefreshToken.Hash(refreshTokenString),
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
        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                throw new ArgumentException("Refresh Token is required ");
            }
            var hashToken = HashRefreshToken.Hash(refreshToken);
            var storedToken = await _refreshTokenRepository.FirstOrDefaultAsync(e => e.Token == hashToken);
            if (storedToken == null)
            {
                throw new UnauthorizedAccessException("Invalid refresh token");
            }
            var user = await _userRepository.GetByIdAsync(storedToken.UserId);
            if (user == null)
            {
                throw new UnauthorizedAccessException("User not found");
            }
            if (!storedToken.IsActive)
            {
                throw new UnauthorizedAccessException("Token is expired or revoked");
            }
            var newAccessToken = _tokenService.GenerateAccessToken(user);
            var newRefreshTokenString = _tokenService.GenerateRefreshToken();

            storedToken.IsRevoked = true;
            storedToken.RevokedAt = DateTime.UtcNow;
            _refreshTokenRepository.Update(storedToken);

            var newRefreshToken = new RefreshToken
            {
                Id = Guid.NewGuid().ToString(),
                Token = HashRefreshToken.Hash(newRefreshTokenString),
                UserId = user.Id,
                User = user,
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddDays(_config.GetValue<int>("Jwt:RefreshTokenExpirationDays"))

            };

            _refreshTokenRepository.Add(newRefreshToken);

            // Clean up old tokens
            await CleanupUserTokenAsync(user.Id);

            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshTokenString,
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
            if (!PasswordHasher.Verify(loginDto.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshTokenString = _tokenService.GenerateRefreshToken();
            await CleanupUserTokenAsync(user.Id);

            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid().ToString(),
                Token = HashRefreshToken.Hash(refreshTokenString),
                UserId = user.Id,
                User = user,
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddDays(_config.GetValue<int>("Jwt:RefreshTokenExpirationDays"))
            };
            _refreshTokenRepository.Add(refreshToken);
            user.IsOnline = true;
            user.LastSeen = DateTime.UtcNow;
            _userRepository.Update(user);

            await _context.SaveChangesAsync();


            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenString,
                User = UserMapper.MapToUserDto(user)
            };

        }
        public async Task LogoutAsync(string userId, string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID is required");

            }
            var user = await _userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                user.IsOnline = false;
                user.LastSeen = DateTime.UtcNow;
                _userRepository.Update(user);
            }
            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                await RevokeRefreshTokenAsync(userId, refreshToken);
            }
            await _context.SaveChangesAsync();

        }
        public async Task RevokeRefreshTokenAsync(string userId, string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID is required");
            }
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                throw new ArgumentException(refreshToken);
            }
            var hashedToken = HashRefreshToken.Hash(refreshToken);
            var storedToken = await _refreshTokenRepository
                        .FirstOrDefaultAsync(e => e.UserId == userId && e.Token == hashedToken);
            if (storedToken != null)
            {
                storedToken.IsRevoked = true;
                storedToken.RevokedAt = DateTime.UtcNow;
                _refreshTokenRepository.Update(storedToken);
            }

        }
        public async Task ChangePasswordAsync(ChangePasswordDto dto, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("UserId is required");

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) ||
                string.IsNullOrWhiteSpace(dto.NewPassword))
                throw new ArgumentException("Password is required");

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new UnauthorizedAccessException("User not found");

            if (!PasswordHasher.Verify(dto.CurrentPassword, user.PasswordHash))
                throw new UnauthorizedAccessException("Old password is incorrect");

            user.PasswordHash = PasswordHasher.Hash(dto.NewPassword);
            user.Updated = DateTime.UtcNow;

            _userRepository.Update(user);


            await _refreshTokenRepository.RevokeAllUserTokensAsync(userId);

            await _context.SaveChangesAsync();
        }

        private async Task CleanupUserTokenAsync(string userId)
        {
            var activedTokens = (await _refreshTokenRepository.GetActiveTokensByUserIdAsync(userId)).ToList();
            if (activedTokens.Count() > MAX_REFRESH_TOKENS_PER_USER)
            {
                var tokensRemove = activedTokens.OrderBy(e => e.Created).
                                                Take(activedTokens.Count() - MAX_REFRESH_TOKENS_PER_USER)
                                                .ToList();
                _refreshTokenRepository.DeleteRange(tokensRemove);
            }

        }


    }
}