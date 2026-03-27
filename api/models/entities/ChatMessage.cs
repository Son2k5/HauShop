using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Enum;

namespace api.Models.Entities
{
    public class ChatMessage
    {
        public string Id { get; set; }
        public string ChatRoomId { get; set; }
        public ChatRoom ChatRoom { get; set; }
        public string SenderId { get; set; }
        public User Sender { get; set; }
        public string Message { get; set; }
        public ChatMessageType MessageType { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime Created { get; set; }
    }

}