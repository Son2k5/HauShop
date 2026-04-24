using api.data;
using api.DTOs.admin;
using api.DTOs.order;
using api.DTOs.product;
using api.models.enums;
using api.services.interfaces.admin;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.admin
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly ApplicationDbContext _context;

        public AdminDashboardService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AdminDashboardDto> GetDashboardAsync(
            int lowStockThreshold = 5,
            int recentOrdersLimit = 10,
            CancellationToken ct = default)
        {
            lowStockThreshold = Math.Max(lowStockThreshold, 0);
            recentOrdersLimit = Math.Clamp(recentOrdersLimit, 1, 20);

            var now = DateTime.UtcNow;
            var todayStart = now.Date;
            var monthStart = new DateTime(now.Year, now.Month, 1);

            var totalUsers = await _context.Users.CountAsync(ct);

            var totalProducts = await _context.Products.CountAsync(ct);

            var activeProducts = await _context.Products
                .CountAsync(p => p.IsActive, ct);

            var totalOrders = await _context.Orders.CountAsync(ct);

            var totalRevenue = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

            var todayRevenue = await _context.Payments
                .Where(p =>
                    p.Status == PaymentStatus.Paid &&
                    p.PaidAt != null &&
                    p.PaidAt >= todayStart)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

            var monthRevenue = await _context.Payments
                .Where(p =>
                    p.Status == PaymentStatus.Paid &&
                    p.PaidAt != null &&
                    p.PaidAt >= monthStart)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

            var pendingReviews = await _context.Reviews
                .CountAsync(r => r.Status == ReviewStatus.WaitingApproval, ct);

            var orderStatusRows = await _context.Orders
                .AsNoTracking()
                .GroupBy(o => o.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToListAsync(ct);

            var lowStockProducts = await _context.Products
                .AsNoTracking()
                .Where(p => p.IsActive)
                .Select(p => new
                {
                    p.Id,
                    p.Sku,
                    p.Name,
                    p.IsActive,
                    Stock = p.ProductVariants
                        .Where(v => v.IsActive)
                        .Sum(v => (int?)v.Stock) ?? 0
                })
                .Where(p => p.Stock <= lowStockThreshold)
                .OrderBy(p => p.Stock)
                .ThenBy(p => p.Name)
                .Take(10)
                .Select(p => new LowStockProductDto
                {
                    Id = p.Id,
                    Sku = p.Sku,
                    Name = p.Name,
                    Stock = p.Stock,
                    IsActive = p.IsActive
                })
                .ToListAsync(ct);

            var recentOrders = await _context.Orders
                .AsNoTracking()
                .Include(o => o.User)
                .OrderByDescending(o => o.Created)
                .Take(recentOrdersLimit)
                .Select(o => new RecentOrderDto
                {
                    Id = o.Id,
                    CustomerName = (o.User.FirstName + " " + o.User.LastName).Trim(),
                    TotalAmount = o.Total,
                    Status = o.Status.ToString(),
                    Created = o.Created
                })
                .ToListAsync(ct);

            return new AdminDashboardDto
            {
                TotalUsers = totalUsers,
                TotalProducts = totalProducts,
                ActiveProducts = activeProducts,
                InactiveProducts = totalProducts - activeProducts,
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                TodayRevenue = todayRevenue,
                MonthRevenue = monthRevenue,
                PendingReviews = pendingReviews,
                OrderStatusCounts = orderStatusRows.ToDictionary(
                    x => x.Status.ToString(),
                    x => x.Count),
                LowStockProducts = lowStockProducts,
                RecentOrders = recentOrders
            };
        }
    }
}
