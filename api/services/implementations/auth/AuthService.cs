using api.data;
using api.helpers;
using api.services.interfaces;
using Microsoft.EntityFrameworkCore;
using api.DTOs.user;
using api.models.enums;
using api.models.entities;
using api.mappings;
using api.repositories.interfaces;
using api.services.interfaces.auth;
using System.Threading;

namespace api.services.implementations.auth
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
        private readonly IAuthTokenCacheService _tokenCache;
        private readonly int MAX_REFRESH_TOKENS_PER_USER = 5;
        private readonly int OTP_EXPIRATION_MINUTES = 15;

        public AuthService(
            ApplicationDbContext context,
            ITokenService tokenService,
            IEmailService emailService,
            IConfiguration config,
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IOtpService otpService,
            IAuthTokenCacheService tokenCache)
        {
            _config = config;
            _context = context;
            _emailService = emailService;
            _tokenService = tokenService;
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _otpService = otpService;
            _tokenCache = tokenCache;
        }

        public async Task<AuthResult<AuthResponseDto>> RegisterAsync(RegisterDto dto)
        {
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingUser != null)
                return AuthResult<AuthResponseDto>.Failure("Email already exists", StatusCodes.Status409Conflict);

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
            await _tokenCache.StoreRefreshTokenAsync(
                refreshToken.Token,
                user.Id,
                TimeSpan.FromDays(refreshTokenDays));

            return AuthResult<AuthResponseDto>.Success(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenValue,
                User = UserMapper.MapToUserDto(user)
            });
        }

        public async Task<AuthResult<AuthResponseDto>> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                return AuthResult<AuthResponseDto>.Failure("Refresh token is required", StatusCodes.Status400BadRequest);

            var hashToken = HashRefreshToken.Hash(refreshToken);
            var storedToken = await _refreshTokenRepository.FirstOrDefaultAsync(e => e.Token == hashToken, CancellationToken.None);
            if (storedToken == null)
                return AuthResult<AuthResponseDto>.Failure("Invalid refresh token", StatusCodes.Status401Unauthorized);

            var user = await _userRepository.GetByIdAsync(storedToken.UserId, CancellationToken.None);
            if (user == null)
                return AuthResult<AuthResponseDto>.Failure("User not found", StatusCodes.Status401Unauthorized);

            if (!storedToken.IsActive)
            {
                await _tokenCache.RemoveRefreshTokenAsync(hashToken);
                return AuthResult<AuthResponseDto>.Failure("Token is expired or revoked", StatusCodes.Status401Unauthorized);
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

            await CleanupUserTokenAsync(user.Id);

            await _context.SaveChangesAsync();
            await _tokenCache.RemoveRefreshTokenAsync(hashToken);
            await _tokenCache.StoreRefreshTokenAsync(
                newRefreshToken.Token,
                user.Id,
                newRefreshToken.Expires - DateTime.UtcNow);

            return AuthResult<AuthResponseDto>.Success(new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshTokenString,
                User = UserMapper.MapToUserDto(user)
            });
        }

        public async Task<AuthResult<AuthResponseDto>> LoginAsync(LoginDto loginDto)
        {
            if (string.IsNullOrWhiteSpace(loginDto.Email))
                return AuthResult<AuthResponseDto>.Failure("Email is required", StatusCodes.Status400BadRequest);

            if (string.IsNullOrWhiteSpace(loginDto.Password))
                return AuthResult<AuthResponseDto>.Failure("Password is required", StatusCodes.Status400BadRequest);

            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
            if (user == null)
                return AuthResult<AuthResponseDto>.Failure("Invalid email or password", StatusCodes.Status401Unauthorized);

            if (!PasswordHasher.Verify(loginDto.Password, user.PasswordHash))
                return AuthResult<AuthResponseDto>.Failure("Invalid email or password", StatusCodes.Status401Unauthorized);

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
            await _tokenCache.StoreRefreshTokenAsync(
                refreshToken.Token,
                user.Id,
                refreshToken.Expires - DateTime.UtcNow);

            return AuthResult<AuthResponseDto>.Success(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenString,
                User = UserMapper.MapToUserDto(user)
            });
        }

        public async Task<AuthResult> LogoutAsync(string userId, string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return AuthResult.Failure("User ID is required", StatusCodes.Status400BadRequest);

            var user = await _userRepository.GetByIdAsync(userId, CancellationToken.None);
            if (user != null)
            {
                user.IsOnline = false;
                user.LastSeen = DateTime.UtcNow;
                _userRepository.Update(user);
            }
            if (!string.IsNullOrWhiteSpace(refreshToken))
                await RevokeRefreshTokenAsync(userId, refreshToken);

            await _context.SaveChangesAsync();
            return AuthResult.Success();
        }

        public async Task<AuthResult> RevokeRefreshTokenAsync(string userId, string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return AuthResult.Failure("User ID is required", StatusCodes.Status400BadRequest);

            if (string.IsNullOrWhiteSpace(refreshToken))
                return AuthResult.Failure("Refresh token is required", StatusCodes.Status400BadRequest);

            var hashedToken = HashRefreshToken.Hash(refreshToken);
            var storedToken = await _refreshTokenRepository
                .FirstOrDefaultAsync(e => e.UserId == userId && e.Token == hashedToken, CancellationToken.None);

            if (storedToken != null)
            {
                storedToken.IsRevoked = true;
                storedToken.RevokedAt = DateTime.UtcNow;
                _refreshTokenRepository.Update(storedToken);
            }
            await _tokenCache.RemoveRefreshTokenAsync(hashedToken);
            await _context.SaveChangesAsync();
            return AuthResult.Success();
        }

        public async Task<AuthResult> ChangePasswordAsync(ChangePasswordDto dto, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return AuthResult.Failure("UserId is required", StatusCodes.Status400BadRequest);

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
                return AuthResult.Failure("Password is required", StatusCodes.Status400BadRequest);

            var user = await _userRepository.GetByIdAsync(userId, CancellationToken.None);
            if (user == null)
                return AuthResult.Failure("User not found", StatusCodes.Status401Unauthorized);

            if (!PasswordHasher.Verify(dto.CurrentPassword, user.PasswordHash))
                return AuthResult.Failure("Old password is incorrect", StatusCodes.Status401Unauthorized);

            user.PasswordHash = PasswordHasher.Hash(dto.NewPassword);
            user.Updated = DateTime.UtcNow;
            _userRepository.Update(user);

            await _refreshTokenRepository.RevokeAllUserTokensAsync(userId);
            await _tokenCache.RemoveAllUserRefreshTokensAsync(userId);
            await _context.SaveChangesAsync();

            await _emailService.SendPasswordChangedNotificationAsync(user.Email, user.FirstName);

            return AuthResult.Success();
        }

        public async Task<AuthResult> ForgotPasswordAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return AuthResult.Failure("Email is required", StatusCodes.Status400BadRequest);

            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
                return AuthResult.Success();

            var existingOtps = await _context.PasswordResetOtps
                .Where(o => o.UserId == user.Id && !o.IsUsed && o.ExpiredAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var otp in existingOtps)
            {
                otp.IsUsed = true;
                otp.UsedAt = DateTime.UtcNow;
            }

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
            await _tokenCache.StorePasswordResetOtpAsync(
                user.Id,
                otpHash,
                TimeSpan.FromMinutes(OTP_EXPIRATION_MINUTES));

            await _emailService.SendPasswordResetOtpAsync(user.Email, user.FirstName, otpCode);

            return AuthResult.Success();
        }

        public async Task<AuthResult<UserDto>> GetCurrentUserAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return AuthResult<UserDto>.Failure("User ID is required", StatusCodes.Status400BadRequest);

            var user = await _userRepository.GetByIdAsync(userId, CancellationToken.None);
            if (user == null)
                return AuthResult<UserDto>.Failure("User not found", StatusCodes.Status404NotFound);

            return AuthResult<UserDto>.Success(UserMapper.MapToUserDto(user));
        }

        public async Task<AuthResult> ResetPasswordAsync(ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return AuthResult.Failure("Email is required", StatusCodes.Status400BadRequest);

            if (string.IsNullOrWhiteSpace(dto.Otp))
                return AuthResult.Failure("OTP is required", StatusCodes.Status400BadRequest);

            if (string.IsNullOrWhiteSpace(dto.NewPassword))
                return AuthResult.Failure("New password is required", StatusCodes.Status400BadRequest);

            var user = await _userRepository.GetByEmailAsync(dto.Email);
            if (user == null)
                return AuthResult.Failure("Invalid email or OTP", StatusCodes.Status401Unauthorized);

            PasswordResetOtp? validOtp = null;
            var cachedOtpHash = await _tokenCache.GetPasswordResetOtpHashAsync(user.Id);
            if (!string.IsNullOrWhiteSpace(cachedOtpHash) &&
                _otpService.VerifyOtp(dto.Otp, cachedOtpHash))
            {
                validOtp = await _context.PasswordResetOtps
                    .Where(o => o.UserId == user.Id &&
                                o.OtpHash == cachedOtpHash &&
                                !o.IsUsed &&
                                o.ExpiredAt > DateTime.UtcNow)
                    .OrderByDescending(o => o.CreatedAt)
                    .FirstOrDefaultAsync();
            }

            var otpRecords = validOtp == null
                ? await _context.PasswordResetOtps
                    .Where(o => o.UserId == user.Id && !o.IsUsed && o.ExpiredAt > DateTime.UtcNow)
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync()
                : new List<PasswordResetOtp>();

            foreach (var record in otpRecords)
            {
                if (_otpService.VerifyOtp(dto.Otp, record.OtpHash))
                {
                    validOtp = record;
                    break;
                }
            }

            if (validOtp == null)
                return AuthResult.Failure("Invalid or expired OTP", StatusCodes.Status401Unauthorized);

            validOtp.IsUsed = true;
            validOtp.UsedAt = DateTime.UtcNow;

            user.PasswordHash = PasswordHasher.Hash(dto.NewPassword);
            user.Updated = DateTime.UtcNow;
            _userRepository.Update(user);

            await _refreshTokenRepository.RevokeAllUserTokensAsync(user.Id);
            await _tokenCache.RemoveAllUserRefreshTokensAsync(user.Id);
            await _tokenCache.RemovePasswordResetOtpAsync(user.Id);

            await _context.SaveChangesAsync();

            await _emailService.SendPasswordChangedNotificationAsync(user.Email, user.FirstName);

            return AuthResult.Success();
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

                foreach (var token in tokensRemove)
                    await _tokenCache.RemoveRefreshTokenAsync(token.Token);
            }
        }
    }
}
