using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.admin;

namespace api.services.interfaces.admin
{
    public interface IAdminDashboardService
    {
        Task<AdminDashboardDto> GetDashboardAsync(int lowStockThreshold = 5, int recentOrderLimit = 10, CancellationToken ct = default);
    }
}