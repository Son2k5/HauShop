using api.models.enums;

namespace api.DTOs.review
{
    public class ReviewDto
    {
        public string Id { get; set; } = default!;
        public string ProductId { get; set; } = default!;
        public string ProductName { get; set; } = default!;
        public string UserId { get; set; } = default!;
        public string UserName { get; set; } = default!;
        public string? UserAvatar { get; set; }
        public int Rating { get; set; }
        public string? Content { get; set; }
        public ReviewStatus Status { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }
}
