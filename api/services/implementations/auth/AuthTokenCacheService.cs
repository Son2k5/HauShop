using api.infrastructure.redis;
using api.services.interfaces.auth;
using api.services.interfaces.caching;
using StackExchange.Redis;

namespace api.services.implementations.auth;

public sealed class AuthTokenCacheService : IAuthTokenCacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<AuthTokenCacheService> _logger;

    public AuthTokenCacheService(
        IConnectionMultiplexer redis,
        IRedisCacheService cache,
        ILogger<AuthTokenCacheService> logger)
    {
        _redis = redis;
        _database = redis.GetDatabase();
        _cache = cache;
        _logger = logger;
    }

    public async Task StoreRefreshTokenAsync(
        string tokenHash,
        string userId,
        TimeSpan ttl,
        CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(StoreRefreshTokenAsync)))
                return;

            var tokenKey = RedisCacheKeys.RefreshToken(tokenHash);
            var userSetKey = RedisCacheKeys.RefreshTokensByUser(userId);

            await _database.StringSetAsync(tokenKey, userId, ttl);
            await _database.SetAddAsync(userSetKey, tokenKey);
            await _database.KeyExpireAsync(userSetKey, ttl + TimeSpan.FromDays(1));
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            _logger.LogWarning(ex, "Failed to cache refresh token. UserId={UserId}", userId);
        }
    }

    public async Task<string?> GetRefreshTokenUserIdAsync(string tokenHash, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(GetRefreshTokenUserIdAsync)))
                return null;

            var userId = await _database.StringGetAsync(RedisCacheKeys.RefreshToken(tokenHash));
            return userId.IsNullOrEmpty ? null : userId.ToString();
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            _logger.LogWarning(ex, "Failed to read refresh token cache.");
            return null;
        }
    }

    public async Task RemoveRefreshTokenAsync(string tokenHash, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(RemoveRefreshTokenAsync)))
                return;

            var tokenKey = RedisCacheKeys.RefreshToken(tokenHash);
            var userId = await _database.StringGetAsync(tokenKey);

            await _database.KeyDeleteAsync(tokenKey);

            if (!userId.IsNullOrEmpty)
                await _database.SetRemoveAsync(RedisCacheKeys.RefreshTokensByUser(userId.ToString()), tokenKey);
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            _logger.LogWarning(ex, "Failed to remove refresh token cache.");
        }
    }

    public async Task RemoveAllUserRefreshTokensAsync(string userId, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(RemoveAllUserRefreshTokensAsync)))
                return;

            var userSetKey = RedisCacheKeys.RefreshTokensByUser(userId);
            var tokenKeys = await _database.SetMembersAsync(userSetKey);
            if (tokenKeys.Length > 0)
            {
                var keys = tokenKeys
                    .Where(value => value.HasValue)
                    .Select(value => (RedisKey)value.ToString())
                    .Append(userSetKey)
                    .ToArray();

                await _database.KeyDeleteAsync(keys);
            }
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            _logger.LogWarning(ex, "Failed to remove all refresh token cache. UserId={UserId}", userId);
        }
    }

    public Task StorePasswordResetOtpAsync(
        string userId,
        string otpHash,
        TimeSpan ttl,
        CancellationToken ct = default)
    {
        return _cache.SetAsync(RedisCacheKeys.PasswordResetOtp(userId), otpHash, ttl, ct: ct);
    }

    public Task<string?> GetPasswordResetOtpHashAsync(string userId, CancellationToken ct = default)
    {
        return _cache.GetAsync<string>(RedisCacheKeys.PasswordResetOtp(userId), ct);
    }

    public Task RemovePasswordResetOtpAsync(string userId, CancellationToken ct = default)
    {
        return _cache.RemoveAsync(RedisCacheKeys.PasswordResetOtp(userId), ct);
    }

    private bool IsRedisAvailable(string operation)
    {
        if (_redis.IsConnected)
            return true;

        _logger.LogDebug("Redis token cache skipped because disconnected. Operation={Operation}", operation);
        return false;
    }
}
