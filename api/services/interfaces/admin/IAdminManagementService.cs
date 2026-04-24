using api.DTOs.admin;
using api.DTOs.product;

namespace api.services.interfaces.admin
{
    public interface IAdminManagementService
    {
        Task<AdminPagedResultDto<AdminUserListItemDto>> GetUsersAsync(
            string? search = null,
            string? role = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken ct = default);

        Task<AdminUserDetailDto> GetUserByIdAsync(string userId, CancellationToken ct = default);

        Task<AdminUserDetailDto> UpdateUserRoleAsync(
            string userId,
            AdminUpdateUserRoleDto dto,
            CancellationToken ct = default);

        Task<AdminUserDetailDto> UpdateUserAsync(
            string userId,
            AdminUpdateUserDto dto,
            CancellationToken ct = default);

        Task<AdminPagedResultDto<AdminOrderListItemDto>> GetOrdersAsync(
            string? search = null,
            string? status = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken ct = default);

        Task<AdminOrderDetailDto> GetOrderByIdAsync(string orderId, CancellationToken ct = default);

        Task<AdminOrderDetailDto> UpdateOrderStatusAsync(
            string orderId,
            AdminUpdateOrderStatusDto dto,
            CancellationToken ct = default);

        Task<AdminInventoryOverviewDto> GetInventoryOverviewAsync(
            int lowStockThreshold = 5,
            CancellationToken ct = default);

        Task<AdminPagedResultDto<ProductSummaryDto>> GetProductsAsync(
            string? search = null,
            bool? isActive = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken ct = default);

        Task<ProductDto> GetProductByIdAsync(string productId, CancellationToken ct = default);

        Task<ProductDto> CreateProductAsync(CreateProductDto dto, CancellationToken ct = default);

        Task<ProductDto> UpdateProductAsync(
            string productId,
            UpdateProductDto dto,
            CancellationToken ct = default);

        Task DeleteProductAsync(string productId, CancellationToken ct = default);

        Task<ProductDto> ToggleProductActiveAsync(string productId, CancellationToken ct = default);

        Task<ProductDto> UpdateInventoryAsync(
            string productId,
            AdminUpdateInventoryDto dto,
            CancellationToken ct = default);

        Task<AdminSettingsDto> GetSettingsAsync(CancellationToken ct = default);

        Task<AdminSettingsDto> UpdateSettingsAsync(
            UpdateAdminSettingsDto dto,
            CancellationToken ct = default);
    }
}
