using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetLink);
        Task SendEmailAsync(string to, string subject, string body);
        Task SendVerifyEmailAsync(string email, string verifyLink);
    }
}