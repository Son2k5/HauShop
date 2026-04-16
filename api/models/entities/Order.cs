using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.entities;
using api.models.enums;

namespace api.models.entities
{
    public class Order
    {
        public string Id { get; set; }
        public string UserId { get; set; }

        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal Total { get; set; }

        public OrderStatus Status { get; set; }

        public string ReceiverName { get; set; }
        public string ReceiverPhone { get; set; }
        public string AddressLine { get; set; }

        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; }
        public ICollection<Payment> Payments { get; set; }
    }

}