using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Entities;
using api.Models.Enum;

namespace api.Models.Entities
{
    public class User
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Password { get; set; }
        public string? MerchantId { get; set; }
        public Merchant? Merchant { get; set; }
        public Provider Provider { get; set; }
        public string GoogleId { get; set; }
        public string FacebookId { get; set; }
        public string Avatar { get; set; }
        public Role Role { get; set; }
        public string ResetPasswordToken { get; set; }
        public DateTime? ResetPasswordExpires { get; set; }
        public bool IsOnline { get; set; }
        public DateTime? LastSeen { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }

        public ICollection<Address> Addresses { get; set; }
        public Cart Cart { get; set; }
        public ICollection<Order> Orders { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public ICollection<Wishlist> Wishlists { get; set; }
        public ICollection<SupportTicket> SupportTicketsAsCustomer { get; set; }
        public ICollection<SupportTicket> SupportTicketsAssigned { get; set; }
        public ICollection<UserConnection> Connections { get; set; }
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
