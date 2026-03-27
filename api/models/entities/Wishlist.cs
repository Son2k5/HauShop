using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Entities;

namespace api.Models.Entities
{
    public class Wishlist
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public User User { get; set; }
        public string ProductId { get; set; }
        public Product Product { get; set; }
        public DateTime Created { get; set; }
    }
}