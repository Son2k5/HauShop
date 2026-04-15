using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.models.entities
{
    public class Product
    {
        public string Id { get; set; }
        public string Sku { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string ImageUrl { get; set; }
        public string ImageKey { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public bool Taxable { get; set; }
        public bool IsActive { get; set; }
        public string? BrandId { get; set; }
        public Brand? Brand { get; set; }

        // Tổng tồn kho (tính từ variants hoặc nhập thủ công)
        public int Stock { get; set; } = 0;


        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
        public ICollection<ProductCategory> ProductCategories { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; }
        public ICollection<CartItem> CartItems { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public ICollection<Wishlist> Wishlists { get; set; }
        public ICollection<ProductVariant> ProductVariants { get; set; }
    }
}