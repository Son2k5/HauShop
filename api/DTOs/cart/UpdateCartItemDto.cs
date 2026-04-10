using System.ComponentModel.DataAnnotations;

namespace api.DTOs.cart
{
    public class UpdateCartItemDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Quantity phải lớn hơn 0")]
        public int Quantity { get; set; }
    }
}