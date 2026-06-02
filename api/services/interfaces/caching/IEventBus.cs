using api.models.enums;

namespace api.services.interfaces.caching;

public interface IEventBus
{
    Task PublishAsync<T>(string channel, T message, CancellationToken ct = default);

    Task<string> EnqueueAsync<T>(string stream, T message, CancellationToken ct = default);
}

public static class EventTopics
{
    public const string OrderCreatedChannel = "haushop:v1:events:order-created";
    public const string InventoryChangedChannel = "haushop:v1:events:inventory-changed";
    public const string NotificationChannel = "haushop:v1:events:notification";

    public const string OrderEventsStream = "haushop:v1:streams:order-events";
    public const string NotificationJobsStream = "haushop:v1:streams:notification-jobs";
}

public sealed record OrderCreatedEvent
{
    public string OrderId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public decimal Total { get; init; }
    public PaymentMethod PaymentMethod { get; init; }
    public List<string> ProductIds { get; init; } = new();
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}
