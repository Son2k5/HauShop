using api.DTOs.chat;
using api.DTOs.notification;
using api.models.enums;

namespace api.services.interfaces.notification
{
    public interface INotificationService
    {
        Task<PagedNotificationDto> GetNotificationsAsync(
            string userId,
            NotificationQueryDto query,
            CancellationToken ct = default);

        Task<int> GetUnreadCountAsync(
            string userId,
            NotificationType? type = null,
            CancellationToken ct = default);

        Task<NotificationDto> MarkAsReadAsync(string userId, string notificationId, CancellationToken ct = default);
        Task<int> MarkAllAsReadAsync(string userId, NotificationType? type = null, CancellationToken ct = default);
        Task DeleteAsync(string userId, string notificationId, CancellationToken ct = default);

        Task NotifyOrderCreatedAsync(string orderId, CancellationToken ct = default);
        Task NotifyPaymentSucceededAsync(string orderId, CancellationToken ct = default);
        Task NotifyChatMessageAsync(ChatMessageDto message, CancellationToken ct = default);
        Task NotifyOrderStatusChangedAsync(
            string orderId,
            OrderStatus previousStatus,
            OrderStatus nextStatus,
            CancellationToken ct = default);
    }
}
