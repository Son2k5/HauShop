using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.data;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.repositories.implementations
{
    public class OrderRepository : Repository<Order>, IOrderRepository
    {
        public OrderRepository(ApplicationDbContext context) : base(context) { }
        public async Task<Order?> GetByIdWithItemsAsync(string id, CancellationToken ct = default)
        {
            return await _context.Set<Order>()
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .Include(o => o.ShippingDetail)
                .FirstOrDefaultAsync(o => o.Id == id, ct);
        }
        public async Task<List<Order>> GetByUserIdAsync(string userId, CancellationToken ct)
        {
            return await _context.Set<Order>()
                            .Where(e => e.UserId == userId)
                            .Include(o => o.OrderItems)
                            .Include(o => o.Payments)
                            .Include(o => o.ShippingDetail)
                            .OrderByDescending(o => o.Created)
                            .ToListAsync(ct);
        }
    }
}