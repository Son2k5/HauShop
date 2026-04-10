namespace api.DTOs.cart
{
    public class CartItemDto
    {
        public string Id { get; set; } = default!;

        public string ProductId { get; set; } = default!;
        public string ProductName { get; set; } = default!;
        public string ProductSlug { get; set; } = default!;
        public string? ProductImageUrl { get; set; }

        public string? ProductVariantId { get; set; }
        public string? VariantSku { get; set; }
        public string? VariantSize { get; set; }
        public string? VariantColor { get; set; }
        public string? VariantImageUrl { get; set; }

        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public int AvailableStock { get; set; }

        public decimal LineTotal => UnitPrice * Quantity;
        public DateTime Created { get; set; }
    }
}