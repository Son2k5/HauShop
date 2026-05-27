using System.IdentityModel.Tokens.Jwt;
using api.infrastructure.redis;
using api.services.interfaces.auth;
using api.services.interfaces.caching;

namespace api.services.implementations.auth;

public sealed class JwtBlacklistService : IJwtBlacklistService
{
    private readonly IRedisCacheService _cache;
    private readonly ILogger<JwtBlacklistService> _logger;

    public JwtBlacklistService(IRedisCacheService cache, ILogger<JwtBlacklistService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task BlacklistTokenAsync(string accessToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
            return;

        try
        {
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(accessToken);
            var jti = jwt.Claims.FirstOrDefault(claim => claim.Type == JwtRegisteredClaimNames.Jti)?.Value;
            if (string.IsNullOrWhiteSpace(jti))
                return;

            var ttl = jwt.ValidTo - DateTime.UtcNow;
            if (ttl <= TimeSpan.Zero)
                return;

            await BlacklistJtiAsync(jti, ttl, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse JWT for blacklist.");
        }
    }

    public Task BlacklistJtiAsync(string jti, TimeSpan ttl, CancellationToken ct = default)
    {
        return _cache.SetAsync(RedisCacheKeys.JwtBlacklist(jti), true, ttl, ct: ct);
    }

    public async Task<bool> IsBlacklistedAsync(string? jti, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
            return false;

        return await _cache.ExistsAsync(RedisCacheKeys.JwtBlacklist(jti), ct);
    }
}
