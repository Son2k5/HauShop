import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  AdminUpdateOrderStatusDto,
  AdminUpdateUserRoleDto,
} from "../@types/admin.type";
import { queryKeys } from "../lib/queryKeys";
import { adminService, type AdminOrderFilters, type AdminUserFilters } from "../services/adminService";

export function useAdminDashboard(lowStockThreshold = 5, recentOrdersLimit = 5) {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(lowStockThreshold, recentOrdersLimit),
    queryFn: () => adminService.getDashboard(lowStockThreshold, recentOrdersLimit),
    staleTime: 60_000,
  });
}

export function useAdminUsers(filters: AdminUserFilters) {
  const normalizedFilters = useMemo(
    () => ({
      search: filters.search?.trim() || undefined,
      role: filters.role || undefined,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10,
    }),
    [filters.page, filters.pageSize, filters.role, filters.search]
  );

  return useQuery({
    queryKey: queryKeys.admin.users(normalizedFilters),
    queryFn: () => adminService.getUsers(normalizedFilters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useAdminUser(userId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.user(userId ?? ""),
    queryFn: () => adminService.getUserById(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useUpdateAdminUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: AdminUpdateUserRoleDto }) =>
      adminService.updateUserRole(userId, dto),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.admin.user(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useAdminOrders(filters: AdminOrderFilters) {
  const normalizedFilters = useMemo(
    () => ({
      search: filters.search?.trim() || undefined,
      status: filters.status || undefined,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10,
    }),
    [filters.page, filters.pageSize, filters.search, filters.status]
  );

  return useQuery({
    queryKey: queryKeys.admin.orders(normalizedFilters),
    queryFn: () => adminService.getOrders(normalizedFilters),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useAdminOrder(orderId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.order(orderId ?? ""),
    queryFn: () => adminService.getOrderById(orderId!),
    enabled: !!orderId,
    staleTime: 20_000,
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      dto,
    }: {
      orderId: string;
      dto: AdminUpdateOrderStatusDto;
    }) => adminService.updateOrderStatus(orderId, dto),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(queryKeys.admin.order(updatedOrder.id), updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useAdminInventory(lowStockThreshold = 5) {
  return useQuery({
    queryKey: queryKeys.admin.inventory(lowStockThreshold),
    queryFn: () => adminService.getInventoryOverview(lowStockThreshold),
    staleTime: 30_000,
  });
}
