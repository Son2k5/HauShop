using api.DTOs.admin;
using api.DTOs.product;
using api.services.interfaces.admin;
using FluentValidation;
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
        private readonly IAdminManagementService _managementService;
        private readonly IValidator<CreateProductDto> _createProductValidator;
        private readonly IValidator<UpdateProductDto> _updateProductValidator;

        public AdminController(
            IAdminDashboardService dashboardService,
            IAdminManagementService managementService,
            IValidator<CreateProductDto> createProductValidator,
            IValidator<UpdateProductDto> updateProductValidator)
        {
            _dashboardService = dashboardService;
            _managementService = managementService;
            _createProductValidator = createProductValidator;
            _updateProductValidator = updateProductValidator;
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

        [HttpGet("users")]
        [ProducesResponseType(typeof(AdminPagedResultDto<AdminUserListItemDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search = null,
            [FromQuery] string? role = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            var result = await _managementService.GetUsersAsync(search, role, page, pageSize, ct);
            return Ok(result);
        }

        [HttpGet("users/{userId}")]
        [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(string userId, CancellationToken ct)
        {
            try
            {
                var result = await _managementService.GetUserByIdAsync(userId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("users/{userId}")]
        [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUser(
            string userId,
            [FromBody] AdminUpdateUserDto dto,
            CancellationToken ct)
        {
            try
            {
                var result = await _managementService.UpdateUserAsync(userId, dto, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPatch("users/{userId}/role")]
        [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserRole(
            string userId,
            [FromBody] AdminUpdateUserRoleDto dto,
            CancellationToken ct)
        {
            try
            {
                var result = await _managementService.UpdateUserRoleAsync(userId, dto, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("orders")]
        [ProducesResponseType(typeof(AdminPagedResultDto<AdminOrderListItemDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOrders(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            var result = await _managementService.GetOrdersAsync(search, status, page, pageSize, ct);
            return Ok(result);
        }

        [HttpGet("orders/{orderId}")]
        [ProducesResponseType(typeof(AdminOrderDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetOrderById(string orderId, CancellationToken ct)
        {
            try
            {
                var result = await _managementService.GetOrderByIdAsync(orderId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPatch("orders/{orderId}/status")]
        [ProducesResponseType(typeof(AdminOrderDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateOrderStatus(
            string orderId,
            [FromBody] AdminUpdateOrderStatusDto dto,
            CancellationToken ct)
        {
            try
            {
                var result = await _managementService.UpdateOrderStatusAsync(orderId, dto, ct);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("products")]
        [ProducesResponseType(typeof(AdminPagedResultDto<ProductSummaryDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProducts(
            [FromQuery] string? search = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            var result = await _managementService.GetProductsAsync(search, isActive, page, pageSize, ct);
            return Ok(result);
        }

        [HttpGet("products/{productId}")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProductById(string productId, CancellationToken ct)
        {
            try
            {
                var result = await _managementService.GetProductByIdAsync(productId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost("products")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateProduct(
            [FromBody] CreateProductDto dto,
            CancellationToken ct)
        {
            var validation = await _createProductValidator.ValidateAsync(dto, ct);
            if (!validation.IsValid)
            {
                return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
            }

            try
            {
                var result = await _managementService.CreateProductAsync(dto, ct);
                return StatusCode(StatusCodes.Status201Created, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("products/{productId}")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProduct(
            string productId,
            [FromBody] UpdateProductDto dto,
            CancellationToken ct)
        {
            var validation = await _updateProductValidator.ValidateAsync(dto, ct);
            if (!validation.IsValid)
            {
                return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
            }

            try
            {
                var result = await _managementService.UpdateProductAsync(productId, dto, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("products/{productId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteProduct(string productId, CancellationToken ct)
        {
            try
            {
                await _managementService.DeleteProductAsync(productId, ct);
                return Ok(new { message = "Product deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPatch("products/{productId}/toggle-active")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleProductActive(string productId, CancellationToken ct)
        {
            try
            {
                var result = await _managementService.ToggleProductActiveAsync(productId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPatch("products/{productId}/inventory")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateInventory(
            string productId,
            [FromBody] AdminUpdateInventoryDto dto,
            CancellationToken ct)
        {
            try
            {
                var result = await _managementService.UpdateInventoryAsync(productId, dto, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("inventory/overview")]
        [ProducesResponseType(typeof(AdminInventoryOverviewDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetInventoryOverview(
            [FromQuery] int lowStockThreshold = 5,
            CancellationToken ct = default)
        {
            var result = await _managementService.GetInventoryOverviewAsync(lowStockThreshold, ct);
            return Ok(result);
        }

        [HttpGet("settings")]
        [ProducesResponseType(typeof(AdminSettingsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSettings(CancellationToken ct = default)
        {
            var result = await _managementService.GetSettingsAsync(ct);
            return Ok(result);
        }

        [HttpPut("settings")]
        [ProducesResponseType(typeof(AdminSettingsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateSettings(
            [FromBody] UpdateAdminSettingsDto dto,
            CancellationToken ct = default)
        {
            try
            {
                var result = await _managementService.UpdateSettingsAsync(dto, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
