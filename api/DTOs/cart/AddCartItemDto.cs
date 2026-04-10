using System.ComponentModel.DataAnnotations;

namespace api.DTOs.cart
{
    public class AddCartItemDto
    {
        [Required]
        public string ProductId { get; set; } = string.Empty;

        public string? VariantId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; } = 1;
    }
}
