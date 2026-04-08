using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.enums;
using api.models.entities;

namespace api.models.entities
{
    public class Review
    {
        public string Id { get; set; }
        public string ProductId { get; set; }
        public Product Product { get; set; }
        public string UserId { get; set; }
        public User User { get; set; }
        public int Rating { get; set; }
        public string Content { get; set; }
        public ReviewStatus Status { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }

}