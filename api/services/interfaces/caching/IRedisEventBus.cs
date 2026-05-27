namespace api.services.interfaces.caching;

public interface IRedisEventBus
{
    Task PublishAsync<T>(string channel, T message, CancellationToken ct = default);

    Task<string> EnqueueAsync<T>(string stream, T message, CancellationToken ct = default);
}
