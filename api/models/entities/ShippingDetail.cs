using System;
using api.models.enums;

namespace api.models.entities
{
    public class ShippingDetail
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string OrderId { get; set; }
        public Order Order { get; set; }

        public ShippingMethod Method { get; set; }
        public decimal Fee { get; set; }

        public string? TrackingNumber { get; set; }
        public string? Carrier { get; set; }
        public DateTime? EstimatedDelivery { get; set; }

        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }
}