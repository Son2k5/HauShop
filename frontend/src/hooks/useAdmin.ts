import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  AdminUpdateInventoryDto,
  AdminUpdateOrderStatusDto,
  AdminUpdateUserDto,
  AdminUpdateUserRoleDto,
  UpdateAdminSettingsDto,
} from "../@types/admin.type";
import type { CreateProductDto, UpdateProductDto } from "../@types/product.type";
import { queryKeys } from "../lib/queryKeys";
import {
  adminService,
  type AdminOrderFilters,
  type AdminProductFilters,
  type AdminUserFilters,
} from "../services/adminService";

export function useAdminDashboard(lowStockThreshold = 5, recentOrdersLimit = 5) {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(lowStockThreshold, recentOrdersLimit),
    queryFn: () => adminService.getDashboard(lowStockThreshold, recentOrdersLimit),
    staleTime: 5 * 60_000,
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
    staleTime: 2 * 60_000,
  });
}

export function useAdminUser(userId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.user(userId ?? ""),
    queryFn: () => adminService.getUserById(userId!),
    enabled: !!userId,
    staleTime: 2 * 60_000,
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

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: AdminUpdateUserDto }) =>
      adminService.updateUser(userId, dto),
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
    staleTime: 60_000,
  });
}

export function useAdminOrder(orderId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.order(orderId ?? ""),
    queryFn: () => adminService.getOrderById(orderId!),
    enabled: !!orderId,
    staleTime: 60_000,
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

export function useAdminProducts(filters: AdminProductFilters) {
  const normalizedFilters = useMemo(
    () => ({
      search: filters.search?.trim() || undefined,
      isActive: filters.isActive,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 12,
    }),
    [filters.isActive, filters.page, filters.pageSize, filters.search]
  );

  return useQuery({
    queryKey: queryKeys.admin.products(normalizedFilters),
    queryFn: () => adminService.getProducts(normalizedFilters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useAdminProduct(productId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.product(productId ?? ""),
    queryFn: () => adminService.getProductById(productId!),
    enabled: !!productId,
    staleTime: 60_000,
  });
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProductDto) => adminService.createProduct(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, dto }: { productId: string; dto: UpdateProductDto }) =>
      adminService.updateProduct(productId, dto),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.admin.product(product.id), product);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["products", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => adminService.deleteProduct(productId),
    onSuccess: (_, productId) => {
      queryClient.removeQueries({ queryKey: queryKeys.admin.product(productId) });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}

export function useToggleAdminProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => adminService.toggleProductActive(productId),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.admin.product(product.id), product);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["products", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useAdminInventory(lowStockThreshold = 5) {
  return useQuery({
    queryKey: queryKeys.admin.inventory(lowStockThreshold),
    queryFn: () => adminService.getInventoryOverview(lowStockThreshold),
    staleTime: 2 * 60_000,
  });
}

export function useUpdateAdminInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, dto }: { productId: string; dto: AdminUpdateInventoryDto }) =>
      adminService.updateInventory(productId, dto),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.admin.product(product.id), product);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: () => adminService.getSettings(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateAdminSettingsDto) => adminService.updateSettings(dto),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.admin.settings(), settings);
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}
