using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.models.entities
{
    public class Category
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string? ParentId { get; set; }
        public Category? Parent { get; set; }
        public bool IsActive { get; set; }
        public ICollection<Category> Children { get; set; }
        public ICollection<ProductCategory> ProductCategories { get; set; }
    }

}