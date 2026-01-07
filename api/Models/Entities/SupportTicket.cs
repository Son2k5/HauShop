using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Enum;

namespace api.Models.Entities
{
    public class SupportTicket
    {
        public string Id { get; set; }
        public string CustomerId { get; set; }
        public User Customer { get; set; }
        public string? AssignedToId { get; set; }
        public User? AssignedTo { get; set; }
        public string ChatRoomId { get; set; }
        public ChatRoom ChatRoom { get; set; }
        public string Subject { get; set; }
        public SupportTicketStatus Status { get; set; }
        public SupportTicketPriority Priority { get; set; }
        public DateTime Created { get; set; }
        public DateTime? ClosedAt { get; set; }
    }
}