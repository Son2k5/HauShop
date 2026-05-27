using api.models.enums;

namespace api.DTOs.order
{
    public class CreateOrderDto
    {
        public string ShippingAddressId { get; set; } = string.Empty;

        public PaymentMethod PaymentMethod {get; set;}

        public decimal ShippingFee {get; set;}
        public string? Note { get; set; }
    }
}
