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
        private static readonly string[] StatusBucketOrder =
        [
            "completed",
            "processing",
            "shipping",
            "cancelled",
            "returned"
        ];

        private static readonly Dictionary<string, (string Label, string Color)> StatusBuckets = new()
        {
            ["completed"] = ("Completed", "#22C55E"),
            ["processing"] = ("Processing", "#4F46E5"),
            ["shipping"] = ("Shipping", "#F59E0B"),
            ["cancelled"] = ("Cancelled", "#EF4444"),
            ["returned"] = ("Returned", "#64748B")
        };

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
            var previousMonthStart = monthStart.AddMonths(-1);
            var dailyStart = todayStart.AddDays(-29);
            var weeklyStart = StartOfWeek(todayStart).AddDays(-77);
            var monthlyStart = monthStart.AddMonths(-5);
            var trendDataStart = new[] { dailyStart.AddDays(-30), weeklyStart.AddDays(-84), monthlyStart.AddMonths(-6) }.Min();

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

            var previousMonthRevenue = await _context.Payments
                .Where(p =>
                    p.Status == PaymentStatus.Paid &&
                    p.PaidAt != null &&
                    p.PaidAt >= previousMonthStart &&
                    p.PaidAt < monthStart)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

            var pendingReviews = await _context.Reviews
                .CountAsync(r => r.Status == ReviewStatus.WaitingApproval, ct);

            var orderStatusRows = await _context.Orders
                .AsNoTracking()
                .GroupBy(o => o.Status)
                .Select(g => new OrderStatusCountRow
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToListAsync(ct);

            var trendPayments = await _context.Payments
                .AsNoTracking()
                .Where(p =>
                    p.Status == PaymentStatus.Paid &&
                    p.PaidAt != null &&
                    p.PaidAt >= trendDataStart)
                .Select(p => new PaymentTrendRow
                {
                    PaidAt = p.PaidAt!.Value,
                    Amount = p.Amount
                })
                .ToListAsync(ct);

            var trendOrders = await _context.Orders
                .AsNoTracking()
                .Where(o => o.Created >= trendDataStart)
                .Select(o => new OrderTrendRow
                {
                    Created = o.Created
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
                    Stock = p.ProductVariants.Any(v => v.IsActive)
                        ? p.ProductVariants
                            .Where(v => v.IsActive)
                            .Sum(v => (int?)v.Stock) ?? 0
                        : p.Stock
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

            var customerOrderCounts = await _context.Orders
                .AsNoTracking()
                .GroupBy(o => o.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Orders = g.Count()
                })
                .ToListAsync(ct);

            var customersWithOrders = customerOrderCounts.Count;
            var returningCustomers = customerOrderCounts.Count(customer => customer.Orders > 1);

            var topSellingProducts = await _context.OrderItems
                .AsNoTracking()
                .Where(item =>
                    item.Order.Status != OrderStatus.Cancelled &&
                    item.Order.Status != OrderStatus.Returned &&
                    item.Order.Status != OrderStatus.Refunded)
                .GroupBy(item => new
                {
                    item.ProductId,
                    item.ProductName,
                    item.Product.ImageUrl
                })
                .Select(group => new TopSellingProductDto
                {
                    ProductId = group.Key.ProductId,
                    Name = group.Key.ProductName,
                    ImageUrl = group.Key.ImageUrl,
                    QuantitySold = group.Sum(item => item.Quantity),
                    Revenue = group.Sum(item => item.Total)
                })
                .OrderByDescending(product => product.QuantitySold)
                .ThenByDescending(product => product.Revenue)
                .Take(10)
                .ToListAsync(ct);

            var orderStatusAnalytics = BuildOrderStatusAnalytics(orderStatusRows, totalOrders);

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
                RevenueGrowthPercent = CalculatePercentChange(monthRevenue, previousMonthRevenue),
                AverageOrderValue = totalOrders > 0 ? Math.Round(totalRevenue / totalOrders, 0) : 0m,
                ConversionRate = null,
                ConversionRateNote = "Traffic tracking is not enabled yet.",
                ReturningCustomers = returningCustomers,
                ReturningCustomerRate = customersWithOrders > 0
                    ? Math.Round((decimal)returningCustomers / customersWithOrders * 100m, 1)
                    : 0m,
                OrderStatusCounts = orderStatusRows.ToDictionary(
                    x => x.Status.ToString(),
                    x => x.Count),
                LowStockProducts = lowStockProducts,
                RecentOrders = recentOrders,
                DailyRevenueTrend = BuildDailyRevenueTrend(trendPayments, trendOrders, dailyStart, 30),
                WeeklyRevenueTrend = BuildWeeklyRevenueTrend(trendPayments, trendOrders, weeklyStart, 12),
                MonthlyRevenueTrend = BuildMonthlyRevenueTrend(trendPayments, trendOrders, monthlyStart, 6),
                OrderStatusAnalytics = orderStatusAnalytics,
                TopSellingProducts = topSellingProducts
            };
        }

        private static List<OrderStatusAnalyticsDto> BuildOrderStatusAnalytics(
            List<OrderStatusCountRow> statusRows,
            int totalOrders)
        {
            var bucketCounts = StatusBucketOrder.ToDictionary(key => key, _ => 0);

            foreach (var row in statusRows)
            {
                var key = GetStatusBucketKey(row.Status);
                bucketCounts[key] += row.Count;
            }

            return StatusBucketOrder
                .Select(key =>
                {
                    var count = bucketCounts[key];
                    var meta = StatusBuckets[key];

                    return new OrderStatusAnalyticsDto
                    {
                        Key = key,
                        Label = meta.Label,
                        Count = count,
                        Percent = totalOrders > 0 ? Math.Round((decimal)count / totalOrders * 100m, 1) : 0m,
                        Color = meta.Color
                    };
                })
                .Where(item => item.Count > 0)
                .ToList();
        }

        private static List<RevenueTrendPointDto> BuildDailyRevenueTrend(
            List<PaymentTrendRow> payments,
            List<OrderTrendRow> orders,
            DateTime start,
            int periods)
        {
            var revenueByDay = payments
                .GroupBy(payment => payment.PaidAt.Date)
                .ToDictionary(group => group.Key, group => group.Sum(payment => payment.Amount));

            var ordersByDay = orders
                .GroupBy(order => order.Created.Date)
                .ToDictionary(group => group.Key, group => group.Count());

            return Enumerable.Range(0, periods)
                .Select(offset =>
                {
                    var periodStart = start.AddDays(offset).Date;
                    var previousStart = periodStart.AddDays(-periods);

                    return CreateTrendPoint(
                        periodStart,
                        periodStart.ToString("dd/MM"),
                        revenueByDay.GetValueOrDefault(periodStart),
                        revenueByDay.GetValueOrDefault(previousStart),
                        ordersByDay.GetValueOrDefault(periodStart));
                })
                .ToList();
        }

        private static List<RevenueTrendPointDto> BuildWeeklyRevenueTrend(
            List<PaymentTrendRow> payments,
            List<OrderTrendRow> orders,
            DateTime start,
            int periods)
        {
            var revenueByWeek = payments
                .GroupBy(payment => StartOfWeek(payment.PaidAt))
                .ToDictionary(group => group.Key, group => group.Sum(payment => payment.Amount));

            var ordersByWeek = orders
                .GroupBy(order => StartOfWeek(order.Created))
                .ToDictionary(group => group.Key, group => group.Count());

            return Enumerable.Range(0, periods)
                .Select(offset =>
                {
                    var periodStart = start.AddDays(offset * 7).Date;
                    var previousStart = periodStart.AddDays(-periods * 7);

                    return CreateTrendPoint(
                        periodStart,
                        periodStart.ToString("dd/MM"),
                        revenueByWeek.GetValueOrDefault(periodStart),
                        revenueByWeek.GetValueOrDefault(previousStart),
                        ordersByWeek.GetValueOrDefault(periodStart));
                })
                .ToList();
        }

        private static List<RevenueTrendPointDto> BuildMonthlyRevenueTrend(
            List<PaymentTrendRow> payments,
            List<OrderTrendRow> orders,
            DateTime start,
            int periods)
        {
            var revenueByMonth = payments
                .GroupBy(payment => new DateTime(payment.PaidAt.Year, payment.PaidAt.Month, 1))
                .ToDictionary(group => group.Key, group => group.Sum(payment => payment.Amount));

            var ordersByMonth = orders
                .GroupBy(order => new DateTime(order.Created.Year, order.Created.Month, 1))
                .ToDictionary(group => group.Key, group => group.Count());

            return Enumerable.Range(0, periods)
                .Select(offset =>
                {
                    var periodStart = start.AddMonths(offset).Date;
                    var previousStart = periodStart.AddMonths(-periods);

                    return CreateTrendPoint(
                        periodStart,
                        periodStart.ToString("MM/yyyy"),
                        revenueByMonth.GetValueOrDefault(periodStart),
                        revenueByMonth.GetValueOrDefault(previousStart),
                        ordersByMonth.GetValueOrDefault(periodStart));
                })
                .ToList();
        }

        private static RevenueTrendPointDto CreateTrendPoint(
            DateTime periodStart,
            string label,
            decimal revenue,
            decimal previousRevenue,
            int orders)
        {
            return new RevenueTrendPointDto
            {
                Label = label,
                PeriodStart = periodStart,
                Revenue = revenue,
                PreviousRevenue = previousRevenue,
                GrowthPercent = CalculatePercentChange(revenue, previousRevenue),
                Orders = orders,
                AverageOrderValue = orders > 0 ? Math.Round(revenue / orders, 0) : 0m
            };
        }

        private static decimal CalculatePercentChange(decimal current, decimal previous)
        {
            if (previous == 0m)
            {
                return current == 0m ? 0m : 100m;
            }

            return Math.Round((current - previous) / previous * 100m, 1);
        }

        private static DateTime StartOfWeek(DateTime date)
        {
            var dayOffset = ((int)date.DayOfWeek + 6) % 7;
            return date.Date.AddDays(-dayOffset);
        }

        private static string GetStatusBucketKey(OrderStatus status)
        {
            return status switch
            {
                OrderStatus.Completed or OrderStatus.Delivered => "completed",
                OrderStatus.Shipping or OrderStatus.HandoverToCarrier or OrderStatus.InTransit
                    or OrderStatus.OutForDelivery or OrderStatus.DeliveryFailed => "shipping",
                OrderStatus.Cancelled => "cancelled",
                OrderStatus.ReturnRequested or OrderStatus.ReturnApproved or OrderStatus.ReturnRejected
                    or OrderStatus.Returned or OrderStatus.Refunded => "returned",
                _ => "processing"
            };
        }

        private sealed class PaymentTrendRow
        {
            public DateTime PaidAt { get; set; }
            public decimal Amount { get; set; }
        }

        private sealed class OrderTrendRow
        {
            public DateTime Created { get; set; }
        }

        private sealed class OrderStatusCountRow
        {
            public OrderStatus Status { get; set; }
            public int Count { get; set; }
        }
    }
}
