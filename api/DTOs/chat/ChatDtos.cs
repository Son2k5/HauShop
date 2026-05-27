namespace api.DTOs.chat
{
    public class ChatRoomDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string? AssignedToId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int UnreadCount { get; set; }
        public ChatMessageDto? LastMessage { get; set; }
        public DateTime Created { get; set; }
        public DateTime? ClosedAt { get; set; }
    }

    public class ChatMessageDto
    {
        public string Id { get; set; } = string.Empty;
        public string ChatRoomId { get; set; } = string.Empty;
        public string SenderId { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string SenderRole { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime Created { get; set; }
    }

    public class SendChatMessageDto
    {
        public string ChatRoomId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string MessageType { get; set; } = "Text";
    }

    public class StartSupportChatDto
    {
        public string? Subject { get; set; }
    }

    public class AiChatResultDto
    {
        public ChatMessageDto AssistantMessage { get; set; } = new();
        public bool RequiresHuman { get; set; }
        public string Intent { get; set; } = "General";
    }
}
