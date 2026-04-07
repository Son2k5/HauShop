using api.Data;
using api.Helpers;
using api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using api.DTOs.User;
using api.Models.Enum;
using api.Models.Entities;
using api.Mappings;
using api.Repositories.Interfaces;
using api.Services.Interfaces.Auth;

namespace api.Services.Implementations.Auth
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUserRepository _userRepository;
        private readonly IOtpService _otpService;
        private readonly int MAX_REFRESH_TOKENS_PER_USER = 5;
        private readonly int OTP_EXPIRATION_MINUTES = 15;

        public AuthService(
            ApplicationDbContext context,
            ITokenService tokenService,
            IEmailService emailService,
            IConfiguration config,
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IOtpService otpService)
        {
            _config = config;
            _context = context;
            _emailService = emailService;
            _tokenService = tokenService;
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _otpService = otpService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingUser != null)
                throw new InvalidOperationException("Email already exists");

            try
            {
                var user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = dto.Email.Trim().ToLowerInvariant(),
                    FirstName = dto.FirstName.Trim(),
                    LastName = dto.LastName?.Trim() ?? string.Empty,
                    PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
                    PasswordHash = PasswordHasher.Hash(dto.Password),
                    Provider = Provider.Local,
                    Role = Role.Member,
                    IsOnline = false,
                    Created = DateTime.UtcNow
                };

                var accessToken = _tokenService.GenerateAccessToken(user);
                var refreshTokenValue = _tokenService.GenerateRefreshToken();

                var refreshTokenDays =
                    _config.GetValue<int?>("Jwt:RefreshTokenExpirationDays") ?? 7;

                var refreshToken = new RefreshToken
                {
                    Id = Guid.NewGuid().ToString(),
                    Token = HashRefreshToken.Hash(refreshTokenValue),
                    UserId = user.Id,
                    Created = DateTime.UtcNow,
                    Expires = DateTime.UtcNow.AddDays(refreshTokenDays)
                };

                _userRepository.Add(user);
                _refreshTokenRepository.Add(refreshToken);

                await _context.SaveChangesAsync();


                return new AuthResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshTokenValue,
                    User = UserMapper.MapToUserDto(user)
                };
            }
            catch
            {

                throw;
            }
        }


        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                throw new ArgumentException("Refresh Token is required");
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
                throw new ArgumentException("Refresh token is required");
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

            // Send notification email
            await _emailService.SendPasswordChangedNotificationAsync(
                user.Email,
                user.FirstName
            );
        }

        public async Task ForgotPasswordAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Email is required");
            }

            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {

                return;
            }

            var existingOtps = await _context.PasswordResetOtps
                .Where(o => o.UserId == user.Id && !o.IsUsed && o.ExpiredAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var otp in existingOtps)
            {
                otp.IsUsed = true;
                otp.UsedAt = DateTime.UtcNow;
            }

            // Generate new OTP
            var otpCode = _otpService.GenerateOtp();
            var otpHash = _otpService.HashOtp(otpCode);

            var passwordResetOtp = new PasswordResetOtp
            {
                Id = Guid.NewGuid().ToString(),
                UserId = user.Id,
                OtpHash = otpHash,
                Purpose = OtpPurpose.ResetPassword,
                ExpiredAt = DateTime.UtcNow.AddMinutes(OTP_EXPIRATION_MINUTES),
                CreatedAt = DateTime.UtcNow
            };

            _context.PasswordResetOtps.Add(passwordResetOtp);
            await _context.SaveChangesAsync();

            // Send OTP via email
            await _emailService.SendPasswordResetOtpAsync(
                user.Email,
                user.FirstName,
                otpCode
            );
        }
        public async Task<UserDto> GetCurrentUserAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID is required");
            }

            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            // Sử dụng Mapper để chuyển đổi từ Entity sang DTO
            return UserMapper.MapToUserDto(user);
        }

        public async Task ResetPasswordAsync(ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                throw new ArgumentException("Email is required");
            }
            if (string.IsNullOrWhiteSpace(dto.Otp))
            {
                throw new ArgumentException("OTP is required");
            }
            if (string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                throw new ArgumentException("New password is required");
            }

            var user = await _userRepository.GetByEmailAsync(dto.Email);
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or OTP");
            }

            var otpRecords = await _context.PasswordResetOtps
                .Where(o => o.UserId == user.Id && !o.IsUsed && o.ExpiredAt > DateTime.UtcNow)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            PasswordResetOtp? validOtp = null;
            foreach (var record in otpRecords)
            {
                if (_otpService.VerifyOtp(dto.Otp, record.OtpHash))
                {
                    validOtp = record;
                    break;
                }
            }

            if (validOtp == null)
            {
                throw new UnauthorizedAccessException("Invalid or expired OTP");
            }

            validOtp.IsUsed = true;
            validOtp.UsedAt = DateTime.UtcNow;

            user.PasswordHash = PasswordHasher.Hash(dto.NewPassword);
            user.Updated = DateTime.UtcNow;
            _userRepository.Update(user);


            await _refreshTokenRepository.RevokeAllUserTokensAsync(user.Id);

            await _context.SaveChangesAsync();


            await _emailService.SendPasswordChangedNotificationAsync(
                user.Email,
                user.FirstName
            );
        }

        private async Task CleanupUserTokenAsync(string userId)
        {
            var activedTokens = (await _refreshTokenRepository.GetActiveTokensByUserIdAsync(userId)).ToList();
            if (activedTokens.Count > MAX_REFRESH_TOKENS_PER_USER)
            {
                var tokensRemove = activedTokens.OrderBy(e => e.Created)
                                                .Take(activedTokens.Count - MAX_REFRESH_TOKENS_PER_USER)
                                                .ToList();
                _refreshTokenRepository.DeleteRange(tokensRemove);
            }
        }
    }
}