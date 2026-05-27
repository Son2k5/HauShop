using System.Text.Json;
using System.Threading;
using api.services.interfaces.caching;
using StackExchange.Redis;

namespace api.services.implementations.caching;

public sealed class RedisCacheService : ICacheService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan FailureBackoff = TimeSpan.FromSeconds(15);
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;
    private readonly ILogger<RedisCacheService> _logger;
    private long _skipRedisUntilTicks;

    public RedisCacheService(IConnectionMultiplexer redis, ILogger<RedisCacheService> logger)
    {
        _redis = redis;
        _database = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(GetAsync), key))
                return default;

            var payload = await _database.StringGetAsync(key);
            if (payload.IsNullOrEmpty)
                return default;

            var envelope = JsonSerializer.Deserialize<CacheEnvelope<T>>(payload.ToString(), JsonOptions);
            if (envelope == null)
                return default;

            if (envelope.AbsoluteExpirationUtc.HasValue &&
                envelope.AbsoluteExpirationUtc.Value <= DateTimeOffset.UtcNow)
            {
                await RemoveAsync(key, ct);
                return default;
            }

            if (envelope.SlidingExpirationSeconds is > 0)
            {
                var ttl = ResolveSlidingTtl(envelope);
                if (ttl > TimeSpan.Zero)
                    await _database.KeyExpireAsync(key, ttl);
            }

            return envelope.Value;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Redis payload deserialize failed. Key={Key}", key);
            return default;
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            MarkRedisFailure(ex, nameof(GetAsync), key);
            return default;
        }
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? absoluteExpirationRelativeToNow = null,
        TimeSpan? slidingExpiration = null,
        CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(SetAsync), key))
                return;

            DateTimeOffset? absoluteExpirationUtc = absoluteExpirationRelativeToNow.HasValue
                ? DateTimeOffset.UtcNow.Add(absoluteExpirationRelativeToNow.Value)
                : null;

            var envelope = new CacheEnvelope<T>
            {
                Value = value,
                AbsoluteExpirationUtc = absoluteExpirationUtc,
                SlidingExpirationSeconds = slidingExpiration.HasValue
                    ? Convert.ToInt32(slidingExpiration.Value.TotalSeconds)
                    : null
            };

            var payload = JsonSerializer.Serialize(envelope, JsonOptions);
            var ttl = ResolveInitialTtl(absoluteExpirationUtc, slidingExpiration);

            await _database.StringSetAsync(key, payload, ttl);
            await TrackKeyAsync(key, ttl);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Redis payload serialize failed. Key={Key}", key);
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            MarkRedisFailure(ex, nameof(SetAsync), key);
        }
    }

    public async Task<T> GetOrSetAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan? absoluteExpirationRelativeToNow = null,
        TimeSpan? slidingExpiration = null,
        CancellationToken ct = default)
    {
        if (!IsRedisAvailable(nameof(GetOrSetAsync), key))
            return await factory(ct);

        var cached = await GetAsync<T>(key, ct);
        if (cached is not null)
            return cached;

        if (!IsRedisAvailable(nameof(GetOrSetAsync), key))
            return await factory(ct);

        var lockKey = $"{key}:lock";
        var lockValue = Guid.NewGuid().ToString("N");
        var lockTaken = false;

        try
        {
            lockTaken = await _database.StringSetAsync(
                lockKey,
                lockValue,
                TimeSpan.FromSeconds(30),
                When.NotExists);

            if (!lockTaken)
            {
                for (var i = 0; i < 80; i++)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(125), ct);
                    cached = await GetAsync<T>(key, ct);
                    if (cached is not null)
                        return cached;
                }
            }
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            MarkRedisFailure(ex, "GetOrSetLock", key);
        }

        try
        {
            var value = await factory(ct);
            await SetAsync(key, value, absoluteExpirationRelativeToNow, slidingExpiration, ct);
            return value;
        }
        finally
        {
            if (lockTaken)
            {
                try
                {
                    var script = """
                        if redis.call('get', KEYS[1]) == ARGV[1] then
                            return redis.call('del', KEYS[1])
                        else
                            return 0
                        end
                        """;

                    await _database.ScriptEvaluateAsync(script, new RedisKey[] { lockKey }, new RedisValue[] { lockValue });
                }
                catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
                {
                    MarkRedisFailure(ex, "GetOrSetLockRelease", key);
                }
            }
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(RemoveAsync), key))
                return;

            await _database.KeyDeleteAsync(key);
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            MarkRedisFailure(ex, nameof(RemoveAsync), key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(RemoveByPrefixAsync), prefix))
                return;

            var indexKey = CacheKeys.CacheIndex(prefix);
            var values = await _database.SetMembersAsync(indexKey);
            if (values.Length == 0)
                return;

            var keys = values
                .Where(value => value.HasValue)
                .Select(value => (RedisKey)value.ToString())
                .Append(indexKey)
                .ToArray();

            await _database.KeyDeleteAsync(keys);
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            MarkRedisFailure(ex, nameof(RemoveByPrefixAsync), prefix);
        }
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(ExistsAsync), key))
                return false;

            return await _database.KeyExistsAsync(key);
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            MarkRedisFailure(ex, nameof(ExistsAsync), key);
            return false;
        }
    }

    public async Task<long> IncrementAsync(string key, TimeSpan expiresIn, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(IncrementAsync), key))
                return 0;

            var value = await _database.StringIncrementAsync(key);
            if (value == 1)
                await _database.KeyExpireAsync(key, expiresIn);

            return value;
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
        {
            MarkRedisFailure(ex, nameof(IncrementAsync), key);
            return 0;
        }
    }

    private async Task TrackKeyAsync(string key, TimeSpan? ttl)
    {
        var prefix = CacheKeys.GetIndexPrefix(key);
        var indexKey = CacheKeys.CacheIndex(prefix);
        await _database.SetAddAsync(indexKey, key);
        await _database.KeyExpireAsync(indexKey, (ttl ?? TimeSpan.FromDays(7)) + TimeSpan.FromDays(1));
    }

    private bool IsRedisAvailable(string operation, string key)
    {
        var skipUntil = Volatile.Read(ref _skipRedisUntilTicks);
        if (skipUntil > DateTimeOffset.UtcNow.UtcTicks)
        {
            _logger.LogDebug("Redis skipped after recent failure. Operation={Operation} Key={Key}", operation, key);
            return false;
        }

        if (_redis.IsConnected)
            return true;

        _logger.LogDebug("Redis skipped because disconnected. Operation={Operation} Key={Key}", operation, key);
        return false;
    }

    private void MarkRedisFailure(Exception ex, string operation, string key)
    {
        var skipUntil = DateTimeOffset.UtcNow.Add(FailureBackoff).UtcTicks;
        Volatile.Write(ref _skipRedisUntilTicks, skipUntil);

        _logger.LogWarning(
            ex,
            "Redis {Operation} failed; skipping Redis for {BackoffSeconds}s. Key={Key}",
            operation,
            FailureBackoff.TotalSeconds,
            key);
    }

    private static TimeSpan? ResolveInitialTtl(
        DateTimeOffset? absoluteExpirationUtc,
        TimeSpan? slidingExpiration)
    {
        var absoluteTtl = absoluteExpirationUtc.HasValue
            ? absoluteExpirationUtc.Value - DateTimeOffset.UtcNow
            : (TimeSpan?)null;

        if (absoluteTtl.HasValue && absoluteTtl.Value <= TimeSpan.Zero)
            return TimeSpan.FromSeconds(1);

        if (absoluteExpirationUtc.HasValue && slidingExpiration.HasValue)
            return absoluteTtl!.Value < slidingExpiration.Value ? absoluteTtl.Value : slidingExpiration.Value;

        if (absoluteExpirationUtc.HasValue)
            return absoluteTtl!.Value;

        return slidingExpiration;
    }

    private static TimeSpan ResolveSlidingTtl<T>(CacheEnvelope<T> envelope)
    {
        var slidingTtl = TimeSpan.FromSeconds(envelope.SlidingExpirationSeconds!.Value);
        if (!envelope.AbsoluteExpirationUtc.HasValue)
            return slidingTtl;

        var absoluteTtl = envelope.AbsoluteExpirationUtc.Value - DateTimeOffset.UtcNow;
        return absoluteTtl < slidingTtl ? absoluteTtl : slidingTtl;
    }

    private sealed class CacheEnvelope<T>
    {
        public T? Value { get; set; }
        public DateTimeOffset? AbsoluteExpirationUtc { get; set; }
        public int? SlidingExpirationSeconds { get; set; }
    }
}
