using api.data;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.repositories.implementations
{
    public class WishlistRepository : Repository<Wishlist>, IWishlistRepository
    {
        public WishlistRepository(ApplicationDbContext context) : base(context) { }

        private IQueryable<Wishlist> BuildQuery(bool tracked = false)
        {
            var query = _context.Set<Wishlist>()
                .Include(w => w.Product)
                    .ThenInclude(p => p.Brand)
                .Include(w => w.Product)
                    .ThenInclude(p => p.ProductCategories)
                        .ThenInclude(pc => pc.Category)
                .Include(w => w.Product)
                    .ThenInclude(p => p.ProductVariants)
                .AsQueryable();

            return tracked ? query : query.AsNoTracking();
        }

        public async Task<List<Wishlist>> GetByUserIdAsync(string userId, CancellationToken ct = default)
        {
            return await BuildQuery()
                .Where(w => w.UserId == userId)
                .OrderByDescending(w => w.Created)
                .ToListAsync(ct);
        }

        public async Task<Wishlist?> GetByUserAndProductAsync(string userId, string productId, CancellationToken ct = default)
        {
            return await BuildQuery()
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId, ct);
        }

        public async Task<Wishlist?> GetTrackedByIdAsync(string id, CancellationToken ct = default)
        {
            return await BuildQuery(tracked: true)
                .FirstOrDefaultAsync(w => w.Id == id, ct);
        }

        public Task<bool> ExistsAsync(string userId, string productId, CancellationToken ct = default)
        {
            return _context.Set<Wishlist>()
                .AnyAsync(w => w.UserId == userId && w.ProductId == productId, ct);
        }
    }
}
