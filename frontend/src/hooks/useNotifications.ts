import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { NotificationFilters, PagedNotificationDto } from "../@types/notification.type";
import type { NotificationType } from "../@types/enums.type";
import { queryKeys } from "../lib/queryKeys";
import { notificationService } from "../services/notificationService";

function normalizeFilters(filters: NotificationFilters = {}) {
  return {
    type: filters.type || undefined,
    isRead: filters.isRead,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 20,
  };
}

export function useNotifications(filters: NotificationFilters = {}, enabled = true) {
  const normalizedFilters = useMemo(
    () => normalizeFilters(filters),
    [filters.isRead, filters.page, filters.pageSize, filters.type]
  );

  return useQuery<PagedNotificationDto>({
    queryKey: queryKeys.notifications.list(normalizedFilters),
    queryFn: () => notificationService.getNotifications(normalizedFilters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount(type?: NotificationType, enabled = true) {
  return useQuery<number>({
    queryKey: queryKeys.notifications.unreadCount(type),
    queryFn: () => notificationService.getUnreadCount(type),
    enabled,
    staleTime: 15_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type?: NotificationType) => notificationService.markAllAsRead(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
