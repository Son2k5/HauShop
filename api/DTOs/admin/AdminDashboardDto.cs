using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.order;
using api.DTOs.product;

namespace api.DTOs.admin
{
    public class AdminDashboardDto
    {
        public int TotalUsers { get; set; }
        public int TotalProducts { get; set; }
        public int ActiveProducts { get; set; }
        public int InactiveProducts { get; set; }
        public int TotalOrders { get; set; }

        public decimal TotalRevenue { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal MonthRevenue { get; set; }

        public int PendingReviews { get; set; }
        public Dictionary<string, int> OrderStatusCounts { get; set; } = new();
        public List<LowStockProductDto> LowStockProducts { get; set; } = new();
        public List<RecentOrderDto> RecentOrders { get; set; } = new();
        public decimal RevenueGrowthPercent { get; set; }
        public decimal AverageOrderValue { get; set; }
        public decimal? ConversionRate { get; set; }
        public string? ConversionRateNote { get; set; }
        public int ReturningCustomers { get; set; }
        public decimal ReturningCustomerRate { get; set; }
        public List<RevenueTrendPointDto> DailyRevenueTrend { get; set; } = new();
        public List<RevenueTrendPointDto> WeeklyRevenueTrend { get; set; } = new();
        public List<RevenueTrendPointDto> MonthlyRevenueTrend { get; set; } = new();
        public List<OrderStatusAnalyticsDto> OrderStatusAnalytics { get; set; } = new();
        public List<TopSellingProductDto> TopSellingProducts { get; set; } = new();

    }

    public class RevenueTrendPointDto
    {
        public string Label { get; set; } = string.Empty;
        public DateTime PeriodStart { get; set; }
        public decimal Revenue { get; set; }
        public decimal PreviousRevenue { get; set; }
        public decimal GrowthPercent { get; set; }
        public int Orders { get; set; }
        public decimal AverageOrderValue { get; set; }
    }

    public class OrderStatusAnalyticsDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Percent { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class TopSellingProductDto
    {
        public string ProductId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }
}
