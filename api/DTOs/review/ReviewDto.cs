using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.enums;

namespace api.DTOs.review
{
    public class ReviewDto
    {
        public string Id { get; set; }
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string? UserAvatar { get; set; }
        public int Rating { get; set; }
        public string? Content { get; set; }
        public ReviewStatus Status { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }
}