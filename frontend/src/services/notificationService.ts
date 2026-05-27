import type { NotificationFilters, PagedNotificationDto, NotificationDto } from "../@types/notification.type";
import type { NotificationType } from "../@types/enums.type";
import { http } from "../lib/http";

export const notificationService = {
  getNotifications(filters: NotificationFilters = {}) {
    return http.get<PagedNotificationDto>("/notifications", {
      params: filters,
    });
  },

  async getUnreadCount(type?: NotificationType) {
    const result = await http.get<{ count: number }>("/notifications/unread-count", {
      params: { type },
    });
    return result.count;
  },

  markAsRead(notificationId: string) {
    return http.patch<NotificationDto>(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(type?: NotificationType) {
    const result = await http.patch<{ count: number }>("/notifications/read-all", undefined, {
      params: { type },
    });
    return result.count;
  },

  delete(notificationId: string) {
    return http.delete(`/notifications/${notificationId}`);
  },
};
