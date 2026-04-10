using System.ComponentModel.DataAnnotations;

namespace api.DTOs.cart
{
    public class AddCartItemDto
    {
        [Required]
        public string ProductVariantId { get; set; } = default!;

        [Range(1, int.MaxValue, ErrorMessage = "Quantity phải lớn hơn 0")]
        public int Quantity { get; set; } = 1;
    }
}