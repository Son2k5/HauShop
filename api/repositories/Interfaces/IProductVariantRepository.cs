using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.entities;

namespace api.repositories.interfaces
{
    public interface IProductVariantRepository : IRepository<ProductVariant>
    {
        Task<ProductVariant?> GetActiveByIdAsync(string productVariantId, CancellationToken ct = default);
        Task<ProductVariant?> GetTrackedByIdAsync(string productVariantId, CancellationToken ct = default);
    }
}