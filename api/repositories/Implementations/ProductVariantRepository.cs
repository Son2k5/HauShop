using api.data;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.repositories.implementations
{
    public class ProductVariantRepository : Repository<ProductVariant>, IProductVariantRepository
    {
        public ProductVariantRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<ProductVariant?> GetActiveByIdAsync(string productVariantId, CancellationToken ct = default)
        {
            return await _dbSet
                .AsNoTracking()
                .Include(v => v.Product)
                .FirstOrDefaultAsync(v => v.Id == productVariantId && v.IsActive, ct);
        }

        public async Task<ProductVariant?> GetTrackedByIdAsync(string productVariantId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(v => v.Product)
                .FirstOrDefaultAsync(v => v.Id == productVariantId, ct);
        }
    }
}