using System.Security.Claims;
using api.DTOs.chat;
using api.data;
using api.models.entities;
using api.services.interfaces.chat;
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

        public ChatHub(ApplicationDbContext context, IChatService chatService, IAiChatService aiChatService)
        {
            _context = context;
            _chatService = chatService;
            _aiChatService = aiChatService;
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
            var userId = GetUserId();
            await _chatService.EnsureCanAccessRoomAsync(roomId, userId, IsAdmin());
            await Groups.AddToGroupAsync(Context.ConnectionId, RoomGroup(roomId));
        }

        public async Task LeaveRoom(string roomId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RoomGroup(roomId));
        }

        public async Task SendMessage(SendChatMessageDto dto)
        {
            var userId = GetUserId();
            var message = await _chatService.SendMessageAsync(
                dto.ChatRoomId,
                userId,
                IsAdmin(),
                dto.Message,
                dto.MessageType);

            await Clients.Group(RoomGroup(dto.ChatRoomId)).SendAsync("ReceiveMessage", message);
            await Clients.Group(AdminGroup).SendAsync("RoomUpdated", dto.ChatRoomId);
        }

        public async Task SendAiMessage(SendChatMessageDto dto)
        {
            if (IsAdmin())
            {
                throw new HubException("Admins cannot use AI customer chat.");
            }

            var userId = GetUserId();
            var message = await _chatService.SendAiCustomerMessageAsync(
                dto.ChatRoomId,
                userId,
                dto.Message,
                dto.MessageType);

            await Clients.Group(RoomGroup(dto.ChatRoomId)).SendAsync("ReceiveMessage", message);

            var aiResult = await _aiChatService.ReplyAsync(dto.ChatRoomId, userId, dto.Message);
            await Clients.Group(RoomGroup(dto.ChatRoomId)).SendAsync("ReceiveMessage", aiResult.AssistantMessage);
        }

        public async Task MarkAsRead(string roomId)
        {
            await _chatService.MarkAsReadAsync(roomId, GetUserId(), IsAdmin());
            await Clients.Group(RoomGroup(roomId)).SendAsync("MessagesRead", new
            {
                chatRoomId = roomId,
                readerId = GetUserId()
            });
        }

        private string GetUserId()
        {
            return Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new HubException("Unauthorized");
        }

        private bool IsAdmin()
        {
            return Context.User?.IsInRole("Admin") == true;
        }

        private const string AdminGroup = "admins";
        private static string UserGroup(string userId) => $"user:{userId}";
        private static string RoomGroup(string roomId) => $"room:{roomId}";
    }
}
