using System;
using api.models.enums;

namespace api.DTOs.order
{
    public class OrderDto
    {
        public string Id { get; set; }
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; }
        public string ReceiverName { get; set; }
        public string ReceiverPhone { get; set; }
        public string AddressLine { get; set; }
        public DateTime? Updated { get; set; }
        public List<PaymentDto> Payments { get; set; }
        public List<OrderItemDto> Items { get; set; }
        public ShippingDetailDto? Shipping { get; set; }
        public List<OrderStatusHistoryDto> StatusHistory { get; set; } = new();

        public DateTime Created { get; set; }
    }

    public class ShippingDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public decimal Fee { get; set; }
        public string? TrackingNumber { get; set; }
        public string? CarrierName { get; set; }
        public string? CarrierCode { get; set; }
        public string? CurrentLocation { get; set; }
        public string? TrackingUrl { get; set; }
        public DateTime? EstimatedDelivery { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public List<ShippingTrackingEventDto> TrackingEvents { get; set; } = new();
    }

    public class ShippingTrackingEventDto
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? TrackingNumber { get; set; }
        public string? CarrierName { get; set; }
        public DateTime OccurredAt { get; set; }
        public DateTime Created { get; set; }
    }

    public class OrderStatusHistoryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? Note { get; set; }
        public string? ActorUserId { get; set; }
        public string? ActorRole { get; set; }
        public DateTime Created { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public OrderStatus Status { get; set; }
        public string? TrackingNumber { get; set; }
        public string? CarrierName { get; set; }
        public string? CarrierCode { get; set; }
        public string? CurrentLocation { get; set; }
        public string? TrackingUrl { get; set; }
        public DateTime? EstimatedDelivery { get; set; }
        public string? Note { get; set; }
    }

}
