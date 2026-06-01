using api.models.enums;

namespace api.models.entities
{
    public class ShippingTrackingEvent
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ShippingDetailId { get; set; } = string.Empty;
        public ShippingDetail ShippingDetail { get; set; } = null!;
        public string OrderId { get; set; } = string.Empty;
        public OrderStatus Status { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? TrackingNumber { get; set; }
        public string? CarrierName { get; set; }
        public DateTime OccurredAt { get; set; }
        public DateTime Created { get; set; }
    }
}
