using System.Security.Claims;
using api.DTOs.chat;
using api.common;
using api.services.interfaces.chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.chat
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost("support/start")]
        public async Task<ActionResult<ChatRoomDto>> StartSupportChat([FromBody] StartSupportChatDto dto, CancellationToken ct)
        {
            var room = await _chatService.GetOrCreateSupportRoomAsync(GetUserId(), dto.Subject, ct);
            return Ok(room);
        }

        [HttpPost("ai/start")]
        public async Task<ActionResult<ChatRoomDto>> StartAiChat(CancellationToken ct)
        {
            var room = await _chatService.GetOrCreateAiRoomAsync(GetUserId(), ct);
            return Ok(room);
        }

        [HttpGet("rooms")]
        public async Task<ActionResult<IReadOnlyList<ChatRoomDto>>> GetRooms(CancellationToken ct)
        {
            var rooms = await _chatService.GetRoomsAsync(GetUserId(), User.IsInRole("Admin"), ct);
            return Ok(rooms);
        }

        [HttpGet("rooms/{roomId}/messages")]
        public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> GetMessages(
            string roomId,
            [FromQuery] int take = 50,
            CancellationToken ct = default)
        {
            var messages = await _chatService.GetMessagesAsync(roomId, GetUserId(), User.IsInRole("Admin"), take, ct);
            return Ok(messages);
        }

        [HttpPost("rooms/{roomId}/read")]
        public async Task<IActionResult> MarkAsRead(string roomId, CancellationToken ct)
        {
            await _chatService.MarkAsReadAsync(roomId, GetUserId(), User.IsInRole("Admin"), ct);
            return NoContent();
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new ApiAuthenticationException("User is not authenticated.");
        }
    }
}
