using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.product;
using api.models.entities;

namespace api.mappings
{
    public class ProductMapping
    {
        public static ProductDto MapToDto(Product p) => new()
        {
            Id = p.Id,
            Sku = p.Sku,
            Name = p.Name,
            Slug = p.Slug,
            Description = p.Description,
            Price = p.Price,
            Taxable = p.Taxable,
            IsActive = p.IsActive,
            ImageUrl = p.ImageUrl,
            ImageKey = p.ImageKey,
            BrandId = p.BrandId,
            Brand = p.Brand == null ? null : new BrandSummaryDto
            {
                Id = p.Brand.Id,
                Name = p.Brand.Name,
                Slug = p.Brand.Slug,
            },
            Categories = p.ProductCategories?
                .Where(pc => pc.Category != null)
                .Select(pc => new CategorySummaryDto
                {
                    Id = pc.Category.Id,
                    Name = pc.Category.Name,
                    Slug = pc.Category.Slug,
                }).ToList() ?? new(),
            Variants = p.ProductVariants?
                .Select(v => new ProductVariantSummaryDto
                {
                    Id = v.Id,
                    Sku = v.Sku,
                    Price = v.Price,
                    Stock = v.Stock,
                    IsActive = v.IsActive,
                }).ToList() ?? new(),
            MinVariantPrice = p.ProductVariants?
                .Where(v => v.IsActive)
                .Select(v => (decimal?)v.Price)
                .Min() ?? p.Price,
            TotalStock = p.ProductVariants?
                .Where(v => v.IsActive)
                .Sum(v => v.Stock) ?? 0,

            // Tồn kho và Rating
            Stock = p.Stock,

            Created = p.Created,
            Updated = p.Updated,
        };
    }
}