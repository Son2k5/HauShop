using System.Security.Claims;
using api.DTOs.chat;
using api.common;
using api.data;
using api.models.entities;
using api.services.interfaces.chat;
using api.services.interfaces.notification;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly IChatService _chatService;
        private readonly IAiChatService _aiChatService;
        private readonly INotificationService _notificationService;
        private readonly IValidator<SendChatMessageDto> _sendMessageValidator;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(
            ApplicationDbContext context,
            IChatService chatService,
            IAiChatService aiChatService,
            INotificationService notificationService,
            IValidator<SendChatMessageDto> sendMessageValidator,
            ILogger<ChatHub> logger)
        {
            _context = context;
            _chatService = chatService;
            _aiChatService = aiChatService;
            _notificationService = notificationService;
            _sendMessageValidator = sendMessageValidator;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var isAdmin = IsAdmin();

            _context.UserConnections.Add(new UserConnection
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                ConnectionId = Context.ConnectionId,
                ConnectedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is not null)
            {
                user.IsOnline = true;
            }

            await _context.SaveChangesAsync();
            await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));

            if (isAdmin)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var connection = await _context.UserConnections
                .FirstOrDefaultAsync(c => c.ConnectionId == Context.ConnectionId);

            if (connection is not null)
            {
                _context.UserConnections.Remove(connection);
                await _context.SaveChangesAsync();
            }

            if (!string.IsNullOrWhiteSpace(userId))
            {
                var hasConnections = await _context.UserConnections.AnyAsync(c => c.UserId == userId);
                if (!hasConnections)
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                    if (user is not null)
                    {
                        user.IsOnline = false;
                        user.LastSeen = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinRoom(string roomId)
        {
            try
            {
                var userId = GetUserId();
                await _chatService.EnsureCanAccessRoomAsync(roomId, userId, IsAdmin(), Context.ConnectionAborted);
                await Groups.AddToGroupAsync(Context.ConnectionId, RoomGroup(roomId), Context.ConnectionAborted);
            }
            catch (HubException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw CreateSafeHubException(ex);
            }
        }

        public async Task LeaveRoom(string roomId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RoomGroup(roomId));
        }

        public async Task SendMessage(SendChatMessageDto dto)
        {
            try
            {
                await ValidateSendMessageAsync(dto);

                var userId = GetUserId();
                var message = await _chatService.SendMessageAsync(
                    dto.ChatRoomId,
                    userId,
                    IsAdmin(),
                    dto.Message,
                    dto.MessageType,
                    Context.ConnectionAborted);

                await Clients.Group(RoomGroup(dto.ChatRoomId)).SendAsync("ReceiveMessage", message, Context.ConnectionAborted);
                await Clients.Group(AdminGroup).SendAsync("RoomUpdated", dto.ChatRoomId, Context.ConnectionAborted);
                await NotifyChatMessageAsync(message);
            }
            catch (HubException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw CreateSafeHubException(ex);
            }
        }

        public async Task SendAiMessage(SendChatMessageDto dto)
        {
            try
            {
                await ValidateSendMessageAsync(dto);

                if (IsAdmin())
                {
                    throw new HubException(ClientErrorMessages.HubCannotProcessDetail);
                }

                var userId = GetUserId();
                var message = await _chatService.SendAiCustomerMessageAsync(
                    dto.ChatRoomId,
                    userId,
                    dto.Message,
                    dto.MessageType,
                    Context.ConnectionAborted);

                await Clients.Group(RoomGroup(dto.ChatRoomId)).SendAsync("ReceiveMessage", message, Context.ConnectionAborted);

                var aiResult = await _aiChatService.ReplyAsync(dto.ChatRoomId, userId, dto.Message, Context.ConnectionAborted);
                await Clients.Group(RoomGroup(dto.ChatRoomId)).SendAsync("ReceiveMessage", aiResult.AssistantMessage, Context.ConnectionAborted);
            }
            catch (HubException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw CreateSafeHubException(ex);
            }
        }

        public async Task MarkAsRead(string roomId)
        {
            try
            {
                await _chatService.MarkAsReadAsync(roomId, GetUserId(), IsAdmin(), Context.ConnectionAborted);
                await Clients.Group(RoomGroup(roomId)).SendAsync("MessagesRead", new
                {
                    chatRoomId = roomId,
                    readerId = GetUserId()
                }, Context.ConnectionAborted);
            }
            catch (HubException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw CreateSafeHubException(ex);
            }
        }

        private string GetUserId()
        {
            return Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new HubException(ClientErrorMessages.UnauthorizedDetail);
        }

        private bool IsAdmin()
        {
            return Context.User?.IsInRole("Admin") == true;
        }

        private const string AdminGroup = "admins";
        private static string UserGroup(string userId) => $"user:{userId}";
        private static string RoomGroup(string roomId) => $"room:{roomId}";

        private async Task ValidateSendMessageAsync(SendChatMessageDto dto)
        {
            if (dto is null)
            {
                throw new HubException(ClientErrorMessages.HubValidationDetail);
            }

            var validation = await _sendMessageValidator.ValidateAsync(dto, Context.ConnectionAborted);
            if (!validation.IsValid)
            {
                throw new HubException(ClientErrorMessages.HubValidationDetail);
            }
        }

        private async Task NotifyChatMessageAsync(ChatMessageDto message)
        {
            try
            {
                await _notificationService.NotifyChatMessageAsync(message, Context.ConnectionAborted);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create chat notification. ChatRoomId={ChatRoomId}, MessageId={MessageId}",
                    message.ChatRoomId,
                    message.Id);
            }
        }

        private HubException CreateSafeHubException(Exception exception)
        {
            if (IsExpectedClientException(exception))
            {
                _logger.LogWarning(
                    exception,
                    "Handled hub exception at {HubMethod}. ConnectionId={ConnectionId}",
                    Context.GetHttpContext()?.Request.Path,
                    Context.ConnectionId);
            }
            else
            {
                _logger.LogError(
                    exception,
                    "Unhandled hub exception at {HubMethod}. ConnectionId={ConnectionId}",
                    Context.GetHttpContext()?.Request.Path,
                    Context.ConnectionId);
            }

            return new HubException(ClientErrorMessages.ToHubMessage(exception));
        }

        private static bool IsExpectedClientException(Exception exception)
        {
            return exception is ArgumentException
                or InvalidOperationException
                or KeyNotFoundException
                or ApiAuthenticationException
                or ForbiddenAccessException
                or UnauthorizedAccessException
                or ValidationException
                or OperationCanceledException;
        }
    }
}
