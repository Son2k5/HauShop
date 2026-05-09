import api from "../api/apiClient";
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
    return api
      .get<AdminDashboardDto>(
        `/admin/dashboard${buildQuery({ lowStockThreshold, recentOrdersLimit })}`
      )
      .then((res) => res.data);
  },

  getUsers(filters: AdminUserFilters = {}) {
    return api
      .get<AdminPagedResultDto<AdminUserListItemDto>>(
        `/admin/users${buildQuery(filters)}`
      )
      .then((res) => res.data);
  },

  getUserById(userId: string) {
    return api.get<AdminUserDetailDto>(`/admin/users/${userId}`).then((res) => res.data);
  },

  updateUserRole(userId: string, dto: AdminUpdateUserRoleDto) {
    return api
      .patch<AdminUserDetailDto>(`/admin/users/${userId}/role`, dto)
      .then((res) => res.data);
  },

  updateUser(userId: string, dto: AdminUpdateUserDto) {
    return api
      .put<AdminUserDetailDto>(`/admin/users/${userId}`, dto)
      .then((res) => res.data);
  },

  getOrders(filters: AdminOrderFilters = {}) {
    return api
      .get<AdminPagedResultDto<AdminOrderListItemDto>>(
        `/admin/orders${buildQuery(filters)}`
      )
      .then((res) => res.data);
  },

  getOrderById(orderId: string) {
    return api
      .get<AdminOrderDetailDto>(`/admin/orders/${orderId}`)
      .then((res) => res.data);
  },

  updateOrderStatus(orderId: string, dto: AdminUpdateOrderStatusDto) {
    return api
      .patch<AdminOrderDetailDto>(`/admin/orders/${orderId}/status`, dto)
      .then((res) => res.data);
  },

  getProducts(filters: AdminProductFilters = {}) {
    return api
      .get<AdminPagedResultDto<ProductSummaryDto>>(
        `/admin/products${buildQuery(filters)}`
      )
      .then((res) => res.data);
  },

  getProductById(productId: string) {
    return api.get<ProductDto>(`/admin/products/${productId}`).then((res) => res.data);
  },

  createProduct(dto: CreateProductDto) {
    return api.post<ProductDto>("/admin/products", dto).then((res) => res.data);
  },

  updateProduct(productId: string, dto: UpdateProductDto) {
    return api
      .put<ProductDto>(`/admin/products/${productId}`, dto)
      .then((res) => res.data);
  },

  deleteProduct(productId: string) {
    return api.delete(`/admin/products/${productId}`).then(() => undefined);
  },

  toggleProductActive(productId: string) {
    return api
      .patch<ProductDto>(`/admin/products/${productId}/toggle-active`)
      .then((res) => res.data);
  },

  getInventoryOverview(lowStockThreshold = 5) {
    return api
      .get<AdminInventoryOverviewDto>(
        `/admin/inventory/overview${buildQuery({ lowStockThreshold })}`
      )
      .then((res) => res.data);
  },

  updateInventory(productId: string, dto: AdminUpdateInventoryDto) {
    return api
      .patch<ProductDto>(`/admin/products/${productId}/inventory`, dto)
      .then((res) => res.data);
  },

  getSettings() {
    return api.get<AdminSettingsDto>("/admin/settings").then((res) => res.data);
  },

  updateSettings(dto: UpdateAdminSettingsDto) {
    return api.put<AdminSettingsDto>("/admin/settings", dto).then((res) => res.data);
  },
};
