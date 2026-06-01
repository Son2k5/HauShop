using api.data;
using api.DTOs.order;
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
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Brand)
                .Include(o => o.Payments)
                .Include(o => o.ShippingDetail)
                    .ThenInclude(s => s!.TrackingEvents)
                .Include(o => o.StatusHistories)
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

        public async Task<(List<OrderSummaryDto> Items, int Total)> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var query = _context.Orders
                .AsNoTracking()
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.Created);

            var total = await query.CountAsync(ct);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new OrderSummaryDto
                {
                    Id = o.Id,
                    Total = o.Total,
                    Status = o.Status.ToString(),
                    Created = o.Created,
                    ItemCount = o.OrderItems.Count
                })
                .ToListAsync(ct);

            return (items, total);
        }

        public async Task<Order?> GetTrackedByTransactionNoAsync(string transactionNo, CancellationToken ct = default)
        {
            return await BuildQuery(tracked: true)
                .FirstOrDefaultAsync(
                    o => o.Payments.Any(p => p.TransactionNo == transactionNo),
                    ct);
        }

    }
}
