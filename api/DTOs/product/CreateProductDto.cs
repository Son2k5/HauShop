using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.product
{
    public class CreateProductDto
    {
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }           // nếu null → tự sinh từ Name
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool Taxable { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string? BrandId { get; set; }
        public List<string> CategoryIds { get; set; } = new();

        public string? ImageUrl { get; set; }
        public string? ImageKey { get; set; }
    }
}