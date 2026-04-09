namespace api.DTOs.product
{
    // Dùng cho list page — đủ field để render card sản phẩm
    // Thay thế cả ProductSummaryDto cũ lẫn ProductListItemDto
    public class ProductSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }

        // Giá thấp nhất trong variant đang active
        // null = chưa có variant nào → dùng Price làm fallback
        public decimal? MinVariantPrice { get; set; }

        // Tổng tồn kho variant đang active
        public int? TotalStock { get; set; }

        public bool IsActive { get; set; }
        public string? BrandId { get; set; }
        public string? BrandName { get; set; }
        public List<CategorySummaryDto> Categories { get; set; } = [];
        public DateTime Created { get; set; }
    }
}