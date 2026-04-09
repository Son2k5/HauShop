using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.product
{
    public class ProductDto
    {
        public string Id { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool Taxable { get; set; }
        public bool IsActive { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageKey { get; set; }
        public string? BrandId { get; set; }
        public BrandSummaryDto? Brand { get; set; }
        public List<CategorySummaryDto> Categories { get; set; } = new();
        public List<ProductVariantSummaryDto> Variants { get; set; } = new();
        public decimal MinVariantPrice { get; set; }
        public int TotalStock { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }
}