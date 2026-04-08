using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.product
{
    public class UpdateProductDto
    {
        public string? Sku { get; set; }
        public string? Name { get; set; }
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public bool? Taxable { get; set; }
        public bool? IsActive { get; set; }
        public string? BrandId { get; set; }
        public List<string>? CategoryIds { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageKey { get; set; }
    }
}