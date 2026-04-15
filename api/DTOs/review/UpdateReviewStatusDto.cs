using System.ComponentModel.DataAnnotations;
using api.models.enums;

namespace api.DTOs.review
{
    public class UpdateReviewStatusDto
    {
        [Required]
        public ReviewStatus Status { get; set; }
    }
}
