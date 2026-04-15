namespace api.DTOs.product
{
    public class ProductSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }

        public decimal? MinVariantPrice { get; set; }

        public string? DefaultVariantId { get; set; }
        public int? TotalStock { get; set; }
        public int Stock { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }

        public bool IsActive { get; set; }
        public string? BrandId { get; set; }
        public string? BrandName { get; set; }
        public List<CategorySummaryDto> Categories { get; set; } = [];
        public DateTime Created { get; set; }


    }
}