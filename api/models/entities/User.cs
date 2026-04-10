using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.entities;
using api.models.enums;

namespace api.models.entities
{
    public class User
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PasswordHash { get; set; }
        public string? MerchantId { get; set; }
        public string? AvatarPublicId { get; set; }
        public Merchant? Merchant { get; set; }
        public Provider Provider { get; set; }
        public string? GoogleId { get; set; }
        public string? FacebookId { get; set; }
        public string? Avatar { get; set; }
        public Role Role { get; set; } = Role.Member;
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

        public ICollection<PasswordResetOtp> PasswordResetOtps { get; set; } = new List<PasswordResetOtp>();
    }
}
