namespace api.DTOs.cart
{
    public class CartDto
    {
        public string Id { get; set; } = default!;
        public string UserId { get; set; } = default!;
        public DateTime Created { get; set; }

        public List<CartItemDto> Items { get; set; } = new();

        public int TotalItems => Items.Sum(x => x.Quantity);
        public decimal Subtotal => Items.Sum(x => x.LineTotal);
    }
}