using api.DTOs.chat;

namespace api.services.interfaces.chat
{
    public interface IChatService
    {
        Task<ChatRoomDto> GetOrCreateSupportRoomAsync(string customerId, string? subject, CancellationToken ct = default);
        Task<IReadOnlyList<ChatRoomDto>> GetRoomsAsync(string userId, bool isAdmin, CancellationToken ct = default);
        Task<IReadOnlyList<ChatMessageDto>> GetMessagesAsync(string roomId, string userId, bool isAdmin, int take = 50, CancellationToken ct = default);
        Task<ChatMessageDto> SendMessageAsync(string roomId, string senderId, bool isAdmin, string message, string messageType = "Text", CancellationToken ct = default);
        Task MarkAsReadAsync(string roomId, string readerId, bool isAdmin, CancellationToken ct = default);
        Task EnsureCanAccessRoomAsync(string roomId, string userId, bool isAdmin, CancellationToken ct = default);
    }
}
