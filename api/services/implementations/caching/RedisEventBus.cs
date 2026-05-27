using System.Text.Json;
using api.services.interfaces.caching;
using StackExchange.Redis;

namespace api.services.implementations.caching;

public sealed class RedisEventBus : IEventBus
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisEventBus> _logger;

    public RedisEventBus(IConnectionMultiplexer redis, ILogger<RedisEventBus> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task PublishAsync<T>(string channel, T message, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(PublishAsync), channel))
                return;

            var payload = JsonSerializer.Serialize(message, JsonOptions);
            await _redis.GetSubscriber().PublishAsync(RedisChannel.Literal(channel), payload);
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException or JsonException)
        {
            _logger.LogWarning(ex, "Redis publish failed. Channel={Channel}", channel);
        }
    }

    public async Task<string> EnqueueAsync<T>(string stream, T message, CancellationToken ct = default)
    {
        try
        {
            ct.ThrowIfCancellationRequested();
            if (!IsRedisAvailable(nameof(EnqueueAsync), stream))
                return string.Empty;

            var payload = JsonSerializer.Serialize(message, JsonOptions);
            var id = await _redis.GetDatabase().StreamAddAsync(
                stream,
                new[] { new NameValueEntry("data", payload) });

            return id.ToString();
        }
        catch (Exception ex) when (ex is RedisException or RedisTimeoutException or JsonException)
        {
            _logger.LogWarning(ex, "Redis stream enqueue failed. Stream={Stream}", stream);
            return string.Empty;
        }
    }

    private bool IsRedisAvailable(string operation, string target)
    {
        if (_redis.IsConnected)
            return true;

        _logger.LogDebug("Redis event bus skipped because disconnected. Operation={Operation} Target={Target}",
            operation, target);
        return false;
    }
}
