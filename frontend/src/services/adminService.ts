import { http } from "../lib/http";
import type {
  AdminDashboardDto,
  AdminInventoryOverviewDto,
  AdminOrderDetailDto,
  AdminOrderListItemDto,
  AdminPagedResultDto,
  AdminSettingsDto,
  AdminUpdateInventoryDto,
  AdminUpdateOrderStatusDto,
  AdminUpdateUserDto,
  AdminUpdateUserRoleDto,
  AdminUserDetailDto,
  AdminUserListItemDto,
  UpdateAdminSettingsDto,
} from "../@types/admin.type";
import type {
  CreateProductDto,
  ProductDto,
  ProductSummaryDto,
  UpdateProductDto,
} from "../@types/product.type";

export type AdminUserFilters = {
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
};

export type AdminOrderFilters = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type AdminProductFilters = {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
};

function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const adminService = {
  getDashboard(lowStockThreshold = 5, recentOrdersLimit = 5) {
    return http.get<AdminDashboardDto>(
      `/admin/dashboard${buildQuery({ lowStockThreshold, recentOrdersLimit })}`
    );
  },

  getUsers(filters: AdminUserFilters = {}) {
    return http.get<AdminPagedResultDto<AdminUserListItemDto>>(
      `/admin/users${buildQuery(filters)}`
    );
  },

  getUserById(userId: string) {
    return http.get<AdminUserDetailDto>(`/admin/users/${userId}`);
  },

  updateUserRole(userId: string, dto: AdminUpdateUserRoleDto) {
    return http.patch<AdminUserDetailDto>(`/admin/users/${userId}/role`, dto);
  },

  updateUser(userId: string, dto: AdminUpdateUserDto) {
    return http.put<AdminUserDetailDto>(`/admin/users/${userId}`, dto);
  },

  getOrders(filters: AdminOrderFilters = {}) {
    return http.get<AdminPagedResultDto<AdminOrderListItemDto>>(
      `/admin/orders${buildQuery(filters)}`
    );
  },

  getOrderById(orderId: string) {
    return http.get<AdminOrderDetailDto>(`/admin/orders/${orderId}`);
  },

  updateOrderStatus(orderId: string, dto: AdminUpdateOrderStatusDto) {
    return http.patch<AdminOrderDetailDto>(`/admin/orders/${orderId}/status`, dto);
  },

  getProducts(filters: AdminProductFilters = {}) {
    return http.get<AdminPagedResultDto<ProductSummaryDto>>(
      `/admin/products${buildQuery(filters)}`
    );
  },

  getProductById(productId: string) {
    return http.get<ProductDto>(`/admin/products/${productId}`);
  },

  createProduct(dto: CreateProductDto) {
    return http.post<ProductDto>("/admin/products", dto);
  },

  updateProduct(productId: string, dto: UpdateProductDto) {
    return http.put<ProductDto>(`/admin/products/${productId}`, dto);
  },

  deleteProduct(productId: string) {
    return http.delete(`/admin/products/${productId}`);
  },

  toggleProductActive(productId: string) {
    return http.patch<ProductDto>(`/admin/products/${productId}/toggle-active`);
  },

  getInventoryOverview(lowStockThreshold = 5) {
    return http.get<AdminInventoryOverviewDto>(
      `/admin/inventory/overview${buildQuery({ lowStockThreshold })}`
    );
  },

  updateInventory(productId: string, dto: AdminUpdateInventoryDto) {
    return http.patch<ProductDto>(`/admin/products/${productId}/inventory`, dto);
  },

  getSettings() {
    return http.get<AdminSettingsDto>("/admin/settings");
  },

  updateSettings(dto: UpdateAdminSettingsDto) {
    return http.put<AdminSettingsDto>("/admin/settings", dto);
  },
};
