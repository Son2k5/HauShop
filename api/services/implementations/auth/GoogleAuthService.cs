
using System.Text.Json;
using api.Data;
using api.DTOs.Auth;
using api.DTOs.User;
using api.Repositories.Interfaces;
using api.Services.Interfaces;
using api.Services.Interfaces.Auth;
using System.Net.Http.Headers;
using api.Models.Entities;
using api.Models.Enum;
using api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace api.Services.Implementations.Auth
{
    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly IConfiguration _config;
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly ITokenService _tokenService;
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<GoogleAuthService> _logger;

        private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
        private const string UserInfoEndpoint = "https://www.googleapis.com/oauth2/v3/userinfo";
        private const string AuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
        public GoogleAuthService(
            IConfiguration config,
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            ITokenService tokenService,
            ApplicationDbContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<GoogleAuthService> logger)
        {

            _config = config;
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _tokenService = tokenService;
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public string BuildAuthorizationUrl(string state)
        {
            var clientId = _config["Google:ClientId"] ?? throw new InvalidOperationException("Google: ClientId is not configure");
            var redirectUri = _config["Google:RedirectUri"] ?? throw new InvalidOperationException("Google: RedirectUri is not configured");

            var query = new Dictionary<string, string>
            {
                ["client_id"] = clientId,
                ["redirect_uri"] = redirectUri,
                ["response_type"] = "code",
                ["scope"] = "openid email profile",
                ["access_type"] = "offline",
                ["state"] = state,
                ["prompt"] = "select_account",
            };
            var queryString = string.Join("&",
                query.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

            return $"{AuthEndpoint}?{queryString}";

        }
        public async Task<AuthResponseDto> HandleCallbackAsync(string code, string state, string expectedState)
        {
            if (string.IsNullOrWhiteSpace(state) || state != expectedState)
            {
                throw new UnauthorizedAccessException("Invalid OAuth state");
            }
            var googleAccessToken = await ExchangeCodeForTokenAsync(code);
            var googleUser = await GetGoogleUserInfoAsync(googleAccessToken);
            if (!googleUser.EmailVerified)
                throw new UnauthorizedAccessException("Google email is not verified");

            var user = await FindOrCreateUserAsync(googleUser);
            var isNewEntity = _context.Entry(user).State == EntityState.Added;
            if (isNewEntity)
                await _context.SaveChangesAsync();
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshTokenString = _tokenService.GenerateRefreshToken();
            var refreshTokenDays = _config.GetValue<int>("Jwt:RefreshTokenExpirationDays", 7);

            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid().ToString(),
                Token = HashRefreshToken.Hash(refreshTokenString),
                UserId = user.Id,
                User = user,
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddDays(refreshTokenDays),
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
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Avatar = user.Avatar
                }
            };

        }

        // --- Helper: Chuyen doi code, ham xu li giay thong hanh
        // chuyen doi tu code sang access token 
        private async Task<string> ExchangeCodeForTokenAsync(string code)
        {
            var clientId = _config["Google:ClientId"];
            var clientSecret = _config["Google:ClientSecret"]
            ?? throw new InvalidOperationException("Google:ClientSecret is not configure");

            var redirect_uri = _config["Google:RedirectUri"];
            var payload = new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"] = redirect_uri,
                ["grant_type"] = "authorization_code"
            };
            var client = _httpClientFactory.CreateClient("google");
            var res = await client.PostAsync(TokenEndpoint, new FormUrlEncodedContent(payload));

            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync();
                _logger.LogError("Google token exchange fail");
                throw new UnauthorizedAccessException("Faild to exchange Google authorization code");
            }
            var json = await res.Content.ReadFromJsonAsync<JsonElement>();
            return json.GetProperty("access_token").GetString() ?? throw new UnauthorizedAccessException("Google access token is missing in response");

        }

        // Ham google lay du lieu tu nguoi dung
        private async Task<GoogleUserInfoDto> GetGoogleUserInfoAsync(string googleAccessToken)
        {
            var client = _httpClientFactory.CreateClient("google");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", googleAccessToken);
            var userinfo = await client.GetFromJsonAsync<GoogleUserInfoDto>(UserInfoEndpoint);
            return userinfo ?? throw new UnauthorizedAccessException("Failed to retrieve Google user info");
        }

        // Ham tim hoac tao user 
        private async Task<User> FindOrCreateUserAsync(GoogleUserInfoDto googleUser)
        {
            // Ưu tiên tìm theo GoogleId
            var user = await _userRepository.GetByGoogleIdAsync(googleUser.Sub);

            if (user != null)
            {
                // Cập nhật avatar nếu thay đổi
                if (googleUser.Picture != null && user.Avatar != googleUser.Picture)
                {
                    user.Avatar = googleUser.Picture;
                    user.Updated = DateTime.UtcNow;
                    _userRepository.Update(user);
                }
                return user;
            }

            // Kiểm tra email đã tồn tại chưa (user đăng ký Local trước)
            var existingByEmail = await _userRepository.GetByEmailAsync(googleUser.Email);

            if (existingByEmail != null)
            {
                // Liên kết Google vào tài khoản Local hiện tại
                existingByEmail.GoogleId = googleUser.Sub;
                existingByEmail.Avatar ??= googleUser.Picture;
                existingByEmail.Updated = DateTime.UtcNow;
                _userRepository.Update(existingByEmail);
                return existingByEmail;
            }

            // Tạo user mới với Provider.Google
            var newUser = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = googleUser.Email.Trim().ToLowerInvariant(),
                FirstName = googleUser.GivenName.Trim(),
                LastName = googleUser.FamilyName?.Trim() ?? string.Empty,
                PhoneNumber = string.Empty,
                PasswordHash = string.Empty,    // không có password vì dùng OAuth
                GoogleId = googleUser.Sub,
                Avatar = googleUser.Picture,
                Provider = Provider.Google,
                Role = Role.Member,
                IsOnline = false,
                Created = DateTime.UtcNow,
            };

            _userRepository.Add(newUser);
            return newUser;
        }

    }

}