namespace api.DTOs.review
{
    public class CreateReviewDto
    {
        public string ProductId { get; set; } = string.Empty;

        public int Rating { get; set; }

        public string? Content { get; set; }
    }
}
