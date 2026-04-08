using Microsoft.EntityFrameworkCore;
using api.models.entities;

namespace api.models.entities
{
    public class Cart
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public User User { get; set; }
        public ICollection<CartItem> Items { get; set; }
        public DateTime Created { get; set; }
    }

}