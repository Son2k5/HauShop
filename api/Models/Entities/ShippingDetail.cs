using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Enum;

namespace api.Models.Entities
{
    public class ShippingDetail
    {
        public string Id { get; set; } = Guid.NewGuid().ToString().Substring(0, 50);
        public string OrderId { get; set; }
        public Order Order { get; set; }
        public ShippingMethod Method { get; set; }
        public decimal Fee { get; set; }
        public string? TrackingNumber { get; set; }
        public string? Carrier { get; set; }
        public DateTime? EstimatedDelivery { get; set; }
        public DateTime Created { get; set; }
    }
}
