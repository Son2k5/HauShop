using api.DTOs.product;
using api.DTOs.wishlist;
using api.models.entities;

namespace api.mappings
{
    public class WishlistMapping
    {
        public static WishlistItemDto MapToDto(Wishlist w)
        {
            var product = w.Product ?? throw new InvalidOperationException("Wishlist product was not loaded.");

            return new WishlistItemDto
            {
                Id = w.Id,
                ProductId = w.ProductId,
                Created = w.Created,
                Product = new ProductSummaryDto
                {
                    Id = product.Id,
                    Sku = product.Sku,
                    Name = product.Name,
                    Slug = product.Slug,
                    ImageUrl = product.ImageUrl,
                    Price = product.Price,
                    IsActive = product.IsActive,
                    BrandId = product.BrandId,
                    BrandName = product.Brand?.Name,
                    Created = product.Created,
                    Stock = product.Stock,
                    AverageRating = product.AverageRating,
                    ReviewCount = product.ReviewCount,
                    MinVariantPrice = product.ProductVariants?
                        .Where(v => v.IsActive)
                        .Select(v => (decimal?)v.Price)
                        .Min() ?? product.Price,
                    DefaultVariantId = product.ProductVariants?
                        .Where(v => v.IsActive && v.Stock > 0)
                        .OrderBy(v => v.CreateAt)
                        .Select(v => v.Id)
                        .FirstOrDefault(),
                    TotalStock = product.ProductVariants?
                        .Where(v => v.IsActive)
                        .Sum(v => v.Stock) ?? product.Stock,
                    Categories = product.ProductCategories?
                        .Where(pc => pc.Category != null)
                        .Select(pc => new CategorySummaryDto
                        {
                            Id = pc.Category.Id,
                            Name = pc.Category.Name,
                            Slug = pc.Category.Slug
                        })
                        .ToList() ?? new List<CategorySummaryDto>()
                }
            };
        }
    }
}
