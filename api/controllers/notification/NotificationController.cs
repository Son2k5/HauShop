using System.Security.Claims;
using api.DTOs.notification;
using api.exceptions;
using api.models.enums;
using api.services.interfaces.notification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.notification
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedNotificationDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedNotificationDto>> GetNotifications(
            [FromQuery] NotificationType? type = null,
            [FromQuery] bool? isRead = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            var result = await _notificationService.GetNotificationsAsync(
                GetUserId(),
                new NotificationQueryDto
                {
                    Type = type,
                    IsRead = isRead,
                    Page = page,
                    PageSize = pageSize
                },
                ct);

            return Ok(result);
        }

        [HttpGet("unread-count")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUnreadCount(
            [FromQuery] NotificationType? type = null,
            CancellationToken ct = default)
        {
            var count = await _notificationService.GetUnreadCountAsync(GetUserId(), type, ct);
            return Ok(new { count });
        }

        [HttpPatch("{notificationId}/read")]
        [ProducesResponseType(typeof(NotificationDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<NotificationDto>> MarkAsRead(string notificationId, CancellationToken ct)
        {
            return Ok(await _notificationService.MarkAsReadAsync(GetUserId(), notificationId, ct));
        }

        [HttpPatch("read-all")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> MarkAllAsRead(
            [FromQuery] NotificationType? type = null,
            CancellationToken ct = default)
        {
            var count = await _notificationService.MarkAllAsReadAsync(GetUserId(), type, ct);
            return Ok(new { count });
        }

        [HttpDelete("{notificationId}")]
        public async Task<IActionResult> Delete(string notificationId, CancellationToken ct)
        {
            await _notificationService.DeleteAsync(GetUserId(), notificationId, ct);
            return NoContent();
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new ApiAuthenticationException("User is not authenticated.");
        }
    }
}
