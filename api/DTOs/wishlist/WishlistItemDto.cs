using api.DTOs.product;

namespace api.DTOs.wishlist
{
    public class WishlistItemDto
    {
        public string Id { get; set; } = default!;
        public string ProductId { get; set; } = default!;
        public DateTime Created { get; set; }
        public ProductSummaryDto Product { get; set; } = default!;
    }
}
