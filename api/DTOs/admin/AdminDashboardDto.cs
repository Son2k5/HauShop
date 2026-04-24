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
        public List<LowStockProductDto> LowStockProducts { get; set; }
        public List<RecentOrderDto> RecentOrders { get; set; }

    }
}