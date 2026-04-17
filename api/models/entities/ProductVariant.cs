using System;
using System.Collections.Generic;

namespace api.models.entities
{
    public class ProductVariant
    {
        public string Id { get; set; }

        public string ProductId { get; set; }

        public string Size { get; set; }
        public string Color { get; set; }

        public string Sku { get; set; }
        public decimal Price { get; set; }
        public int Stock { get; set; }

        public string? ImageUrl { get; set; }
        public string? ImageKey { get; set; }
        public DateTime? CreateAt { get; set; }
        public string? CreateBy { get; set; }
        public DateTime? UpdateAt { get; set; }
        public string? UpdateBy { get; set; }

        public bool IsActive { get; set; }

        // Navigation properties
        public Product Product { get; set; } = null!;
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    }
}
