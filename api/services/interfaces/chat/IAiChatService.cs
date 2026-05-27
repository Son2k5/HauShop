using api.DTOs.chat;

namespace api.services.interfaces.chat
{
    public interface IAiChatService
    {
        Task<AiChatResultDto> ReplyAsync(string roomId, string customerId, string message, CancellationToken ct = default);
    }
}
