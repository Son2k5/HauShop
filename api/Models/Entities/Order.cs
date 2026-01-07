using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Entities;
using api.Models.Enum;

namespace api.Models.Entities
{
    public class Order
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public User User { get; set; }
        public decimal Total { get; set; }
        public OrderStatus Status { get; set; }
        public string? ShippingAddressId { get; set; }
        public Address? ShippingAddress { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
        public ICollection<Payment> Payments { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; }
    }

}