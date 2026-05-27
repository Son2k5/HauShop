import type { NotificationType } from "../@types/enums.type";

export const notificationTypeLabels: Record<NotificationType, string> = {
  OrderStatus: "Trạng thái đơn",
  Payment: "Thanh toán",
  Return: "Hoàn hàng",
  Refund: "Hoàn tiền",
};

export function formatNotificationType(type: NotificationType) {
  return notificationTypeLabels[type] ?? type;
}

export function formatNotificationDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
