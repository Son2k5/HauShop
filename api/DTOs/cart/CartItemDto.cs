using System;

namespace api.DTOs.cart
{
    public class CartItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public string? VariantId { get; set; }
        public string? VariantName { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal TotalPrice => Price * Quantity;
        public DateTime Created { get; set; }
    }
}
