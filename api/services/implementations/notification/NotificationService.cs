using System.Text.Json;
using api.data;
using api.DTOs.notification;
using api.hubs;
using api.models.entities;
using api.models.enums;
using api.services.interfaces.notification;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.notification
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<PagedNotificationDto> GetNotificationsAsync(
            string userId,
            NotificationQueryDto query,
            CancellationToken ct = default)
        {
            var page = Math.Max(query.Page, 1);
            var pageSize = Math.Clamp(query.PageSize, 1, 50);

            var source = _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId);

            if (query.Type.HasValue)
            {
                source = source.Where(n => n.Type == query.Type.Value);
            }

            if (query.IsRead.HasValue)
            {
                source = source.Where(n => n.IsRead == query.IsRead.Value);
            }

            var total = await source.CountAsync(ct);
            var items = await source
                .OrderByDescending(n => n.Created)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => MapNotification(n))
                .ToListAsync(ct);

            return new PagedNotificationDto
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        public async Task<int> GetUnreadCountAsync(
            string userId,
            NotificationType? type = null,
            CancellationToken ct = default)
        {
            var query = _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId && !n.IsRead);

            if (type.HasValue)
            {
                query = query.Where(n => n.Type == type.Value);
            }

            return await query.CountAsync(ct);
        }

        public async Task<NotificationDto> MarkAsReadAsync(string userId, string notificationId, CancellationToken ct = default)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Notification not found");

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(ct);
                await PushUnreadCountAsync(userId, ct);
            }

            return MapNotification(notification);
        }

        public async Task<int> MarkAllAsReadAsync(string userId, NotificationType? type = null, CancellationToken ct = default)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead);

            if (type.HasValue)
            {
                query = query.Where(n => n.Type == type.Value);
            }

            var notifications = await query.ToListAsync(ct);
            if (notifications.Count == 0)
            {
                return 0;
            }

            var now = DateTime.UtcNow;
            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = now;
            }

            await _context.SaveChangesAsync(ct);
            await PushUnreadCountAsync(userId, ct);
            return notifications.Count;
        }

        public async Task DeleteAsync(string userId, string notificationId, CancellationToken ct = default)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Notification not found");

            var wasUnread = !notification.IsRead;
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync(ct);

            if (wasUnread)
            {
                await PushUnreadCountAsync(userId, ct);
            }
        }

        public async Task NotifyOrderCreatedAsync(string orderId, CancellationToken ct = default)
        {
            var order = await LoadOrderForNotificationAsync(orderId, ct);
            await CreateOrderNotificationsAsync(
                order,
                NotificationType.OrderStatus,
                "Đơn hàng mới",
                BuildOrderStatusMessage(order, OrderStatus.Pending, isNewOrder: true),
                OrderStatus.Pending,
                null,
                ct);
        }

        public async Task NotifyPaymentSucceededAsync(string orderId, CancellationToken ct = default)
        {
            var order = await LoadOrderForNotificationAsync(orderId, ct);
            await CreateOrderNotificationsAsync(
                order,
                NotificationType.Payment,
                "Thanh toán thành công",
                $"Đơn hàng #{ShortOrderId(order.Id)} đã thanh toán thành công.",
                null,
                PaymentStatus.Paid.ToString(),
                ct);
        }

        public async Task NotifyOrderStatusChangedAsync(
            string orderId,
            OrderStatus previousStatus,
            OrderStatus nextStatus,
            CancellationToken ct = default)
        {
            if (previousStatus == nextStatus)
            {
                return;
            }

            var order = await LoadOrderForNotificationAsync(orderId, ct);
            var type = nextStatus switch
            {
                OrderStatus.ReturnRequested or OrderStatus.ReturnApproved or OrderStatus.Returned => NotificationType.Return,
                OrderStatus.Refunded => NotificationType.Refund,
                _ => NotificationType.OrderStatus
            };

            await CreateOrderNotificationsAsync(
                order,
                type,
                BuildOrderStatusTitle(nextStatus),
                BuildOrderStatusMessage(order, nextStatus),
                nextStatus,
                previousStatus.ToString(),
                ct);
        }

        private async Task<Order> LoadOrderForNotificationAsync(string orderId, CancellationToken ct)
        {
            return await _context.Orders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Brand)
                .FirstOrDefaultAsync(o => o.Id == orderId, ct)
                ?? throw new KeyNotFoundException("Order not found");
        }

        private async Task CreateOrderNotificationsAsync(
            Order order,
            NotificationType type,
            string title,
            string message,
            OrderStatus? status,
            string? previousStatusOrPaymentStatus,
            CancellationToken ct)
        {
            var recipients = await ResolveOrderRecipientsAsync(order, ct);
            if (recipients.Count == 0)
            {
                return;
            }

            var now = DateTime.UtcNow;
            var metadata = JsonSerializer.Serialize(new
            {
                orderId = order.Id,
                status = status?.ToString(),
                previous = previousStatusOrPaymentStatus
            });

            var notifications = recipients.Select(recipient => new Notification
            {
                Id = Guid.NewGuid().ToString(),
                UserId = recipient.UserId,
                Type = type,
                Title = title,
                Message = BuildRecipientMessage(message, recipient.Role, order.Id),
                Link = BuildOrderLink(order.Id, recipient.Role),
                OrderId = order.Id,
                MetadataJson = metadata,
                IsRead = false,
                Created = now
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync(ct);

            foreach (var notification in notifications)
            {
                var dto = MapNotification(notification);
                await _hubContext.Clients
                    .Group(NotificationHub.UserGroup(notification.UserId))
                    .SendAsync("ReceiveNotification", dto, ct);
                await PushUnreadCountAsync(notification.UserId, ct);
            }
        }

        private async Task<List<NotificationRecipient>> ResolveOrderRecipientsAsync(Order order, CancellationToken ct)
        {
            var merchantIds = order.OrderItems
                .Select(i => i.Product?.Brand?.MerchantId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .Distinct()
                .ToList();

            var users = await _context.Users
                .AsNoTracking()
                .Where(u =>
                    u.Id == order.UserId ||
                    u.Role == Role.Admin ||
                    (u.Role == Role.Merchant && u.MerchantId != null && merchantIds.Contains(u.MerchantId)))
                .Select(u => new NotificationRecipient(u.Id, u.Role))
                .ToListAsync(ct);

            return users
                .GroupBy(u => u.UserId)
                .Select(g => g.OrderByDescending(x => x.Role == Role.Admin).First())
                .ToList();
        }

        private async Task PushUnreadCountAsync(string userId, CancellationToken ct)
        {
            var unreadCount = await GetUnreadCountAsync(userId, null, ct);
            await _hubContext.Clients
                .Group(NotificationHub.UserGroup(userId))
                .SendAsync("UnreadCountChanged", unreadCount, ct);
        }

        private static NotificationDto MapNotification(Notification notification) =>
            new()
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Type = notification.Type,
                Title = notification.Title,
                Message = notification.Message,
                Link = notification.Link,
                OrderId = notification.OrderId,
                IsRead = notification.IsRead,
                ReadAt = notification.ReadAt,
                Created = notification.Created
            };

        private static string BuildOrderStatusTitle(OrderStatus status) =>
            status switch
            {
                OrderStatus.Pending => "Đơn hàng đang chờ xử lý",
                OrderStatus.Processing => "Đơn hàng đang được xử lý",
                OrderStatus.Shipping => "Đơn hàng đang giao",
                OrderStatus.Completed => "Giao hàng thành công",
                OrderStatus.Cancelled => "Đơn hàng đã hủy",
                OrderStatus.ReturnRequested => "Yêu cầu trả hàng đã được ghi nhận",
                OrderStatus.ReturnApproved => "Yêu cầu trả hàng đã được duyệt",
                OrderStatus.Returned => "Đã nhận hàng trả về",
                OrderStatus.Refunded => "Đã hoàn tiền",
                _ => "Cập nhật đơn hàng"
            };

        private static string BuildOrderStatusMessage(Order order, OrderStatus status, bool isNewOrder = false)
        {
            if (isNewOrder)
            {
                return $"Đơn hàng #{ShortOrderId(order.Id)} đã được tạo và đang chờ xử lý.";
            }

            var statusText = status switch
            {
                OrderStatus.Pending => "đang chờ xử lý",
                OrderStatus.Processing => "đang được xử lý",
                OrderStatus.Shipping => "đang được giao",
                OrderStatus.Completed => "đã giao thành công",
                OrderStatus.Cancelled => "đã bị hủy",
                OrderStatus.ReturnRequested => "đã ghi nhận yêu cầu trả hàng/đổi trả",
                OrderStatus.ReturnApproved => "đã được duyệt trả hàng/đổi trả",
                OrderStatus.Returned => "đã hoàn tất nhận hàng trả về",
                OrderStatus.Refunded => "đã hoàn tiền",
                _ => $"đã chuyển sang {status}"
            };

            return $"Đơn hàng #{ShortOrderId(order.Id)} {statusText}.";
        }

        private static string BuildRecipientMessage(string message, Role role, string orderId)
        {
            if (role is Role.Admin or Role.Merchant)
            {
                return $"{message} Mở quản lý đơn hàng để kiểm tra chi tiết.";
            }

            return message;
        }

        private static string BuildOrderLink(string orderId, Role role) =>
            role is Role.Admin or Role.Merchant
                ? $"/admin/orders?orderId={Uri.EscapeDataString(orderId)}"
                : $"/orders/{Uri.EscapeDataString(orderId)}";

        private static string ShortOrderId(string orderId) =>
            orderId.Length <= 8 ? orderId.ToUpperInvariant() : orderId[^8..].ToUpperInvariant();

        private sealed record NotificationRecipient(string UserId, Role Role);
    }
}
