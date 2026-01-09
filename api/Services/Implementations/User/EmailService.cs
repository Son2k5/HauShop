using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using api.Models.Email;
using api.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace api.Services.Implementations.User
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;

        public EmailService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetLink)
        {
            var subject = "Reset Your Password";

            var body = $@"
                <h2>Password Reset</h2>
                <p>You requested a password reset.</p>
                <p>Click the link below to reset your password:</p>
                <a href='{resetLink}'>Reset Password</a>
                <p>If you did not request this, please ignore this email.</p>
            ";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendVerifyEmailAsync(string email, string verifyLink)
        {
            var subject = "Verify Your Email Address";

            var body = $@"
                <h2>Email Verification</h2>
                <p>Please verify your email by clicking the link below:</p>
                <a href='{verifyLink}'>Verify Email</a>
            ";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var message = new MimeMessage();

            // FROM
            message.From.Add(new MailboxAddress(
                _emailSettings.SenderName,
                _emailSettings.SenderEmail
            ));

            // TO
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            // BODY
            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = body
            };
            message.Body = bodyBuilder.ToMessageBody();

            // SMTP
            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(
                _emailSettings.SmtpServer,
                _emailSettings.SmtpPort,
                _emailSettings.SecureSocketOptions   // ✅ KHỚP MODEL
            );

            await smtp.AuthenticateAsync(
                _emailSettings.Username,
                _emailSettings.Password
            );

            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);
        }
    }
}
