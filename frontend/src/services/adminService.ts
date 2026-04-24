import api from "../api/apiClient";
import type {
  AdminDashboardDto,
  AdminInventoryOverviewDto,
  AdminOrderDetailDto,
  AdminOrderListItemDto,
  AdminPagedResultDto,
  AdminUpdateOrderStatusDto,
  AdminUpdateUserRoleDto,
  AdminUserDetailDto,
  AdminUserListItemDto,
} from "../@types/admin.type";

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

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
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

  getInventoryOverview(lowStockThreshold = 5) {
    return api
      .get<AdminInventoryOverviewDto>(
        `/admin/inventory/overview${buildQuery({ lowStockThreshold })}`
      )
      .then((res) => res.data);
  },
};
