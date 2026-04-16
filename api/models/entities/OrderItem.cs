using System;

namespace api.models.entities
{
    public class OrderItem
    {
        public string Id { get; set; }
        public string OrderId { get; set; }
        public Order Order { get; set; }

        public string ProductId { get; set; }
        public Product Product { get; set; }

        public string? ProductVariantId { get; set; }

        public string ProductName { get; set; }
        public string? VariantSku { get; set; }
        public string? VariantSize { get; set; }
        public string? VariantColor { get; set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total { get; set; }

        public DateTime Created { get; set; }
    }
}