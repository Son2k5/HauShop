using System.ComponentModel.DataAnnotations;

namespace api.DTOs.review
{
    public class CreateReviewDto
    {
        [Required]
        public string ProductId { get; set; } = string.Empty;

        [Range(1, 5, ErrorMessage = "Rating phải từ 1 đến 5")]
        public int Rating { get; set; }

        [StringLength(2000, ErrorMessage = "Nội dung tối đa 2000 ký tự")]
        public string? Content { get; set; }
    }
}
