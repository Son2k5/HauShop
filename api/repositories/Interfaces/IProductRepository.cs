using api.DTOs.product;
using api.models.entities;

namespace api.repositories.interfaces
{
    public interface IProductRepository : IRepository<Product>
    {
        Task<(List<ProductSummaryDto> Items, int Total)> GetPagedAsync(
            ProductQueryDto q,
            CancellationToken ct = default);

        Task<Product?> GetByIdWithIncludesAsync(string id, CancellationToken ct = default);

        Task<Product?> GetBySlugAsync(string slug, CancellationToken ct = default);

        Task<bool> ExistsSkuAsync(string sku, string? excludeId = null, CancellationToken ct = default);

        Task<bool> ExistsSlugAsync(string slug, string? excludeId = null, CancellationToken ct = default);

        Task SyncCategoriesAsync(string productId, List<string> categoryIds, CancellationToken ct = default);
        Task<int> SaveChangesAsync(CancellationToken ct = default);
    }
}