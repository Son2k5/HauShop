using api.models.enums;

namespace api.models.entities
{
    public class Review
    {
        public string Id { get; set; } = default!;
        public string ProductId { get; set; } = default!;
        public Product Product { get; set; } = default!;
        public string UserId { get; set; } = default!;
        public User User { get; set; } = default!;
        public int Rating { get; set; }
        public string? Content { get; set; }
        public ReviewStatus Status { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }

}
