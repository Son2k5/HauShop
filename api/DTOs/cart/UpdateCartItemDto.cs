using System.ComponentModel.DataAnnotations;

namespace api.DTOs.cart
{
    public class UpdateCartItemDto
    {
        [Range(0, int.MaxValue, ErrorMessage = "Quantity must be non-negative")]
        public int Quantity { get; set; }
    }
}
