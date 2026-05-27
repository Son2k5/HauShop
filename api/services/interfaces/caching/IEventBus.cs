namespace api.services.interfaces.caching;

public interface IEventBus
{
    Task PublishAsync<T>(string channel, T message, CancellationToken ct = default);

    Task<string> EnqueueAsync<T>(string stream, T message, CancellationToken ct = default);
}
