using System;

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

        public DateTime Created { get; set; }
    }

}