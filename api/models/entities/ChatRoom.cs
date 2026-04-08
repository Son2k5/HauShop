using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.enums;

namespace api.models.entities
{
    public class ChatRoom
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public bool IsPrivate { get; set; }
        public ChatRoomType Type { get; set; }
        public DateTime Created { get; set; }
        public ICollection<ChatMessage> Messages { get; set; }
        public SupportTicket SupportTicket { get; set; }
    }
}