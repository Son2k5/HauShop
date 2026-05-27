using api.models.enums;

namespace api.events;

public sealed record OrderCreatedEvent
{
    public string OrderId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public decimal Total { get; init; }
    public PaymentMethod PaymentMethod { get; init; }
    public List<string> ProductIds { get; init; } = new();
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}
