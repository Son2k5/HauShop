using api.DTOs.admin;
using api.services.interfaces.admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.admin
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Policy = "AdminOnly")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminDashboardService _dashboardService;

        public AdminController(IAdminDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetDashboard(
            [FromQuery] int lowStockThreshold = 5,
            [FromQuery] int recentOrdersLimit = 5,
            CancellationToken ct = default)
        {
            var result = await _dashboardService.GetDashboardAsync(
                lowStockThreshold,
                recentOrdersLimit,
                ct);

            return Ok(result);
        }
    }
}
