using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.models.entities
{
    public class UserConnection
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public User User { get; set; }
        public string ConnectionId { get; set; }
        public DateTime ConnectedAt { get; set; }
        public DateTime? LastActivity { get; set; }
    }
}