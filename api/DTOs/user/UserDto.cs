using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.user
{
    public class UserDto
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Avatar { get; set; }
        public string Role { get; set; }
        public string? MerchantId { get; set; }
        public DateTime Created { get; set; }
        public bool? IsOnline { get; set; }
        public DateTime? LastSeen { get; set; }

    }
}