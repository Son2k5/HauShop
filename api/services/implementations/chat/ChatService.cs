using api.data;
using api.DTOs.chat;
using api.models.entities;
using api.models.enums;
using api.services.interfaces.chat;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.chat
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;

        public ChatService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ChatRoomDto> GetOrCreateSupportRoomAsync(string customerId, string? subject, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(customerId))
            {
                throw new UnauthorizedAccessException("User is not authenticated.");
            }

            var customer = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == customerId, ct)
                ?? throw new KeyNotFoundException("Customer not found");

            var existing = await _context.SupportTickets
                .AsNoTracking()
                .Include(t => t.Customer)
                .Include(t => t.ChatRoom)
                .Where(t => t.CustomerId == customerId && t.Status != SupportTicketStatus.Closed)
                .OrderByDescending(t => t.Created)
                .FirstOrDefaultAsync(ct);

            if (existing is not null)
            {
                return await MapRoomAsync(existing.ChatRoomId, customerId, false, ct);
            }

            var trimmedSubject = string.IsNullOrWhiteSpace(subject) ? "Support chat" : subject.Trim();
            if (trimmedSubject.Length > 500)
            {
                throw new ArgumentException("Subject must be 500 characters or fewer.");
            }

            var room = new ChatRoom
            {
                Id = Guid.NewGuid().ToString(),
                Name = $"Support - {BuildFullName(customer)}",
                IsPrivate = true,
                Type = ChatRoomType.Support,
                Created = DateTime.UtcNow
            };

            var ticket = new SupportTicket
            {
                Id = Guid.NewGuid().ToString(),
                CustomerId = customerId,
                ChatRoomId = room.Id,
                Subject = trimmedSubject,
                Status = SupportTicketStatus.Open,
                Priority = SupportTicketPriority.Medium,
                Created = DateTime.UtcNow
            };

            _context.ChatRooms.Add(room);
            _context.SupportTickets.Add(ticket);
            await _context.SaveChangesAsync(ct);

            return await MapRoomAsync(room.Id, customerId, false, ct);
        }

        public async Task<IReadOnlyList<ChatRoomDto>> GetRoomsAsync(string userId, bool isAdmin, CancellationToken ct = default)
        {
            var query = _context.SupportTickets
                .AsNoTracking()
                .Include(t => t.Customer)
                .Include(t => t.ChatRoom)
                .AsQueryable();

            if (!isAdmin)
            {
                query = query.Where(t => t.CustomerId == userId);
            }

            var tickets = await query
                .OrderByDescending(t => t.ChatRoom.Messages.Max(m => (DateTime?)m.Created) ?? t.Created)
                .Take(100)
                .ToListAsync(ct);

            var rooms = new List<ChatRoomDto>();
            foreach (var ticket in tickets)
            {
                rooms.Add(await MapTicketAsync(ticket, userId, isAdmin, ct));
            }

            return rooms;
        }

        public async Task<IReadOnlyList<ChatMessageDto>> GetMessagesAsync(string roomId, string userId, bool isAdmin, int take = 50, CancellationToken ct = default)
        {
            await EnsureCanAccessRoomAsync(roomId, userId, isAdmin, ct);

            take = Math.Clamp(take, 1, 100);
            var messages = await _context.ChatMessages
                .AsNoTracking()
                .Include(m => m.Sender)
                .Where(m => m.ChatRoomId == roomId)
                .OrderByDescending(m => m.Created)
                .Take(take)
                .OrderBy(m => m.Created)
                .ToListAsync(ct);

            return messages.Select(MapMessage).ToList();
        }

        public async Task<ChatMessageDto> SendMessageAsync(string roomId, string senderId, bool isAdmin, string message, string messageType = "Text", CancellationToken ct = default)
        {
            await EnsureCanAccessRoomAsync(roomId, senderId, isAdmin, ct);

            var normalizedMessage = message?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedMessage))
            {
                throw new ArgumentException("Message is required.");
            }

            if (normalizedMessage.Length > 5000)
            {
                throw new ArgumentException("Message must be 5000 characters or fewer.");
            }

            if (!Enum.TryParse<ChatMessageType>(messageType, true, out var parsedType))
            {
                throw new ArgumentException("Message type is invalid.");
            }

            var room = await _context.ChatRooms.FirstOrDefaultAsync(r => r.Id == roomId, ct)
                ?? throw new KeyNotFoundException("Chat room not found");

            var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == senderId, ct)
                ?? throw new KeyNotFoundException("Sender not found");

            if (room.Type != ChatRoomType.Support)
            {
                throw new InvalidOperationException("Only support chat rooms are supported.");
            }

            var chatMessage = new ChatMessage
            {
                Id = Guid.NewGuid().ToString(),
                ChatRoomId = roomId,
                SenderId = senderId,
                Message = normalizedMessage,
                MessageType = parsedType,
                IsRead = false,
                Created = DateTime.UtcNow
            };

            _context.ChatMessages.Add(chatMessage);

            if (isAdmin)
            {
                var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.ChatRoomId == roomId, ct);
                if (ticket is not null && string.IsNullOrWhiteSpace(ticket.AssignedToId))
                {
                    ticket.AssignedToId = senderId;
                }
            }

            await _context.SaveChangesAsync(ct);

            chatMessage.Sender = sender;
            return MapMessage(chatMessage);
        }

        public async Task MarkAsReadAsync(string roomId, string readerId, bool isAdmin, CancellationToken ct = default)
        {
            await EnsureCanAccessRoomAsync(roomId, readerId, isAdmin, ct);

            var unread = await _context.ChatMessages
                .Where(m => m.ChatRoomId == roomId && m.SenderId != readerId && !m.IsRead)
                .ToListAsync(ct);

            if (unread.Count == 0)
            {
                return;
            }

            var now = DateTime.UtcNow;
            foreach (var message in unread)
            {
                message.IsRead = true;
                message.ReadAt = now;
            }

            await _context.SaveChangesAsync(ct);
        }

        public async Task EnsureCanAccessRoomAsync(string roomId, string userId, bool isAdmin, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(roomId))
            {
                throw new ArgumentException("Chat room id is required.");
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new UnauthorizedAccessException("User is not authenticated.");
            }

            var ticket = await _context.SupportTickets
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.ChatRoomId == roomId, ct)
                ?? throw new KeyNotFoundException("Support ticket not found");

            if (!isAdmin && ticket.CustomerId != userId)
            {
                throw new UnauthorizedAccessException("You cannot access this chat room.");
            }

            if (ticket.Status == SupportTicketStatus.Closed)
            {
                throw new InvalidOperationException("This support chat is closed.");
            }
        }

        private async Task<ChatRoomDto> MapRoomAsync(string roomId, string userId, bool isAdmin, CancellationToken ct)
        {
            var ticket = await _context.SupportTickets
                .AsNoTracking()
                .Include(t => t.Customer)
                .Include(t => t.ChatRoom)
                .FirstOrDefaultAsync(t => t.ChatRoomId == roomId, ct)
                ?? throw new KeyNotFoundException("Support ticket not found");

            return await MapTicketAsync(ticket, userId, isAdmin, ct);
        }

        private async Task<ChatRoomDto> MapTicketAsync(SupportTicket ticket, string userId, bool isAdmin, CancellationToken ct)
        {
            var lastMessage = await _context.ChatMessages
                .AsNoTracking()
                .Include(m => m.Sender)
                .Where(m => m.ChatRoomId == ticket.ChatRoomId)
                .OrderByDescending(m => m.Created)
                .FirstOrDefaultAsync(ct);

            var unreadCount = await _context.ChatMessages
                .AsNoTracking()
                .CountAsync(m => m.ChatRoomId == ticket.ChatRoomId && !m.IsRead && m.SenderId != userId, ct);

            return new ChatRoomDto
            {
                Id = ticket.ChatRoomId,
                Name = ticket.ChatRoom.Name,
                Type = ticket.ChatRoom.Type.ToString(),
                CustomerId = ticket.CustomerId,
                CustomerName = BuildFullName(ticket.Customer),
                CustomerEmail = ticket.Customer.Email,
                AssignedToId = ticket.AssignedToId,
                Status = ticket.Status.ToString(),
                Priority = ticket.Priority.ToString(),
                UnreadCount = unreadCount,
                LastMessage = lastMessage is null ? null : MapMessage(lastMessage),
                Created = ticket.Created,
                ClosedAt = ticket.ClosedAt
            };
        }

        private static ChatMessageDto MapMessage(ChatMessage message)
        {
            return new ChatMessageDto
            {
                Id = message.Id,
                ChatRoomId = message.ChatRoomId,
                SenderId = message.SenderId,
                SenderName = BuildFullName(message.Sender),
                SenderRole = message.Sender.Role.ToString(),
                Message = message.Message,
                MessageType = message.MessageType.ToString(),
                IsRead = message.IsRead,
                ReadAt = message.ReadAt,
                Created = message.Created
            };
        }

        private static string BuildFullName(User user)
        {
            var fullName = $"{user.FirstName} {user.LastName}".Trim();
            return string.IsNullOrWhiteSpace(fullName) ? user.Email : fullName;
        }
    }
}
