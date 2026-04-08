using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.product;
using api.models.entities;

namespace api.repositories.Interfaces
{
    public interface IProductRepository
    {
        Task<(List<Product> Items, int Total)> GetPageAsync(ProductQueryDto query);
        Task<Product?> GetByIdAsync(string id);
        Task<Product?> GetBySlugAsync(string slug);
        Task<bool> ExistsSkuAsync(string sku, string? excludeId = null);
        Task<bool> ExistsSlugAsync(string slug, string? excludeId = null);

    }
}