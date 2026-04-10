namespace api.models.entities
{
    public class CartItem
    {
        public string Id { get; set; }

        public string CartId { get; set; }
        public Cart Cart { get; set; } = default!;

        public string ProductId { get; set; }
        public Product Product { get; set; } = default!;

        public string? ProductVariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; }

        public int Quantity { get; set; }

        // snapshot giá tại thời điểm add vào cart
        public decimal Price { get; set; }

        public DateTime Created { get; set; }
    }
}