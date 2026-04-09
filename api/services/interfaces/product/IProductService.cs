using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.product;

namespace api.services.interfaces.product
{
    public interface IProductService
    {
        Task<PagedProductDto> GetProductsAsync(ProductQueryDto query, CancellationToken ct = default);
        Task<ProductDto> GetByIdAsync(string id, CancellationToken ct = default);
        Task<ProductDto> GetBySlugAsync(string slug, CancellationToken ct = default);
        Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken ct = default);
        Task<ProductDto> UpdateAsync(string id, UpdateProductDto dto, CancellationToken ct = default);
        Task DeleteAsync(string id, CancellationToken ct = default);
        Task<ProductDto> ToggleActiveAsync(string id, CancellationToken ct = default);
    }
}