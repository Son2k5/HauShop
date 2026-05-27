using api.data;
using api.models.entities;
using api.models.enums;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.repositories.implementations
{
    public class ReviewRepository : Repository<Review>, IReviewRepository
    {
        public ReviewRepository(ApplicationDbContext context) : base(context) { }

        private IQueryable<Review> BuildQuery(bool tracked = false)
        {
            var query = _context.Set<Review>()
                .Include(r => r.Product)
                .Include(r => r.User)
                .AsQueryable();

            return tracked ? query : query.AsNoTracking();
        }

        public async Task<(List<Review> Items, int Total)> GetApprovedByProductIdAsync(
            string productId,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = BuildQuery()
                .Where(r => r.ProductId == productId && r.Status == ReviewStatus.Approved)
                .OrderByDescending(r => r.Created);

            var total = await query.CountAsync(ct);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            return (items, total);
        }

        public async Task<(List<Review> Items, int Total)> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = BuildQuery()
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.Created);

            var total = await query.CountAsync(ct);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            return (items, total);
        }

        public async Task<(List<Review> Items, int Total)> GetPendingAsync(
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = BuildQuery()
                .Where(r => r.Status == ReviewStatus.WaitingApproval)
                .OrderBy(r => r.Created);

            var total = await query.CountAsync(ct);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            return (items, total);
        }

        public Task<bool> ExistsByUserAndProductAsync(
            string userId,
            string productId,
            CancellationToken ct = default)
        {
            return _context.Set<Review>()
                .AnyAsync(r => r.UserId == userId && r.ProductId == productId, ct);
        }

        public Task<Review?> GetTrackedWithIncludesAsync(string reviewId, CancellationToken ct = default)
        {
            return BuildQuery(tracked: true)
                .FirstOrDefaultAsync(r => r.Id == reviewId, ct);
        }

        public Task<Review?> GetByUserAndProductAsync(
            string userId,
            string productId,
            CancellationToken ct = default)
        {
            return BuildQuery()
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ProductId == productId, ct);
        }
    }
}
