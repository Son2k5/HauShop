namespace api.DTOs.cart
{
    public class AddCartItemDto
    {
        public string ProductVariantId { get; set; } = default!;

        public int Quantity { get; set; } = 1;
    }
}
