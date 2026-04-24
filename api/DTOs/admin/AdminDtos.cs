using api.DTOs.product;
using api.models.enums;

namespace api.DTOs.admin
{
    public class AdminPagedResultDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class AdminUserListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = string.Empty;
        public string? MerchantId { get; set; }
        public bool IsOnline { get; set; }
        public DateTime Created { get; set; }
        public DateTime? LastSeen { get; set; }
    }

    public class AdminUserDetailDto : AdminUserListItemDto
    {
        public int TotalOrders { get; set; }
        public decimal TotalSpent { get; set; }
        public DateTime? LastOrderAt { get; set; }
    }

    public class AdminUpdateUserRoleDto
    {
        public Role Role { get; set; }
        public string? MerchantId { get; set; }
    }

    public class AdminUpdateUserDto
    {
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? MerchantId { get; set; }
    }

    public class AdminOrderListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string ReceiverName { get; set; } = string.Empty;
        public string ReceiverPhone { get; set; } = string.Empty;
        public decimal Total { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public int ItemCount { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }

    public class AdminOrderDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerEmail { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public string ReceiverPhone { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
        public List<AdminOrderItemDto> Items { get; set; } = new();
    }

    public class AdminOrderItemDto
    {
        public string ProductId { get; set; } = string.Empty;
        public string? ProductVariantId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? VariantSku { get; set; }
        public string? VariantSize { get; set; }
        public string? VariantColor { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total { get; set; }
    }

    public class AdminUpdateOrderStatusDto
    {
        public OrderStatus Status { get; set; }
    }

    public class AdminInventoryOverviewDto
    {
        public int TotalProducts { get; set; }
        public int ActiveProducts { get; set; }
        public int TotalVariants { get; set; }
        public int ActiveVariants { get; set; }
        public int TotalStock { get; set; }
        public int LowStockCount { get; set; }
        public int OutOfStockCount { get; set; }
        public List<LowStockProductDto> LowStockProducts { get; set; } = new();
    }

    public class AdminUpdateVariantInventoryDto
    {
        public string VariantId { get; set; } = string.Empty;
        public int Stock { get; set; }
        public bool? IsActive { get; set; }
    }

    public class AdminUpdateInventoryDto
    {
        public int? Stock { get; set; }
        public List<AdminUpdateVariantInventoryDto> Variants { get; set; } = new();
    }

    public class AdminSettingsDto
    {
        public string StoreName { get; set; } = string.Empty;
        public string SupportEmail { get; set; } = string.Empty;
        public string? SupportPhone { get; set; }
        public int LowStockThreshold { get; set; }
        public int RecentOrdersLimit { get; set; }
        public bool EnableOrderNotifications { get; set; }
        public bool EnableInventoryAlerts { get; set; }
        public bool EnableWeeklySummary { get; set; }
        public DateTime? Updated { get; set; }
    }

    public class UpdateAdminSettingsDto
    {
        public string StoreName { get; set; } = string.Empty;
        public string SupportEmail { get; set; } = string.Empty;
        public string? SupportPhone { get; set; }
        public int LowStockThreshold { get; set; }
        public int RecentOrdersLimit { get; set; }
        public bool EnableOrderNotifications { get; set; }
        public bool EnableInventoryAlerts { get; set; }
        public bool EnableWeeklySummary { get; set; }
    }
}
