import type { NotificationType } from "./enums.type";

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  orderId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  created: string;
}

export interface PagedNotificationDto {
  items: NotificationDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificationFilters {
  type?: NotificationType | "";
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}
