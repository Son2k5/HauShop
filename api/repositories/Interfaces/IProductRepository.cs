using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.product;
using api.models.entities;
using api.repositories.implementations;

namespace api.repositories.interfaces
{
    public interface IProductRepository : IRepository<Product>
    {
        Task<(List<Product> Items, int Total)> GetPagedAsync(ProductQueryDto query);
        Task<Product?> GetByIdWithIncludesAsync(string id);
        Task<Product?> GetBySlugAsync(string slug);
        Task<bool> ExistsSkuAsync(string sku, string? excludeId = null);
        Task<bool> ExistsSlugAsync(string slug, string? excludeId = null);
        Task SyncCategoriesAsync(string productId, List<string> categoryIds);

    }
}