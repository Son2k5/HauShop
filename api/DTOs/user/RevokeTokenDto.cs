using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.User
{
    public class RevokeTokenDto
    {
        public string RefreshToken { get; set; } = null!;
    }
}