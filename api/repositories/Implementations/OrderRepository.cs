using api.data;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.repositories.implementations
{
    public class OrderRepository : Repository<Order>, IOrderRepository
    {
        public OrderRepository(ApplicationDbContext context) : base(context)
        {
        }

        private IQueryable<Order> BuildQuery(bool tracked = false)
        {
            IQueryable<Order> query = _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .Include(o => o.ShippingDetail)
                .Include(o => o.ShippingAddress);

            if (!tracked)
            {
                query = query.AsNoTracking();
            }

            return query;
        }

        public async Task<Order?> GetByIdWithIncludesAsync(string id, CancellationToken ct = default)
        {
            return await BuildQuery(tracked: false)
                .FirstOrDefaultAsync(o => o.Id == id, ct);
        }

        public async Task<Order?> GetTrackedByIdWithIncludesAsync(string id, CancellationToken ct = default)
        {
            return await BuildQuery(tracked: true)
                .FirstOrDefaultAsync(o => o.Id == id, ct);
        }

        public async Task<List<Order>> GetByUserIdAsync(string userId, CancellationToken ct = default)
        {
            return await BuildQuery(tracked: false)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.Created)
                .ToListAsync(ct);
        }

        public async Task<Order?> GetTrackedByTransactionNoAsync(string transactionNo, CancellationToken ct = default)
        {
            return await BuildQuery(tracked: true)
                .FirstOrDefaultAsync(
                    o => o.Payments.Any(p => p.TransactionNo == transactionNo),
                    ct);
        }

        public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            return await _context.SaveChangesAsync(ct);
        }
    }
}