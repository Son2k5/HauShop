using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using api.models.enums;

namespace api.models.entities
{
    public class PasswordResetOtp
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = null!;
        public User User { get; set; } = null!;

        public string OtpHash { get; set; } = null!;

        public OtpPurpose Purpose { get; set; } = OtpPurpose.ResetPassword;

        public DateTime ExpiredAt { get; set; }

        public bool IsUsed { get; set; } = false;
        public DateTime? UsedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        [NotMapped]
        public bool IsActive =>
            !IsUsed && ExpiredAt > DateTime.UtcNow;
    }
}