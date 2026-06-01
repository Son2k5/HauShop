using api.models.enums;

namespace api.models.entities
{
    public class OrderStatusHistory
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string OrderId { get; set; } = string.Empty;
        public Order Order { get; set; } = null!;
        public OrderStatus Status { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? Note { get; set; }
        public string? ActorUserId { get; set; }
        public string? ActorRole { get; set; }
        public DateTime Created { get; set; }
    }
}
