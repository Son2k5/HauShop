using MailKit.Net.Smtp;
using MimeKit;
using api.Models.Email;
using api.Services.Interfaces.Auth;
using Microsoft.Extensions.Options;

namespace api.Services.Implementations.Auth
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;

        public EmailService(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
        }

        // ======================================================
        // 1. OTP RESET PASSWORD
        // ======================================================
        public async Task SendPasswordResetOtpAsync(
            string email,
            string firstName,
            string otp)
        {
            var subject = "Password Reset";

            var body = BuildBaseTemplate($@"
                <p>Hi <strong>{firstName}</strong>,</p>
                <p>Please use the OTP below to reset your password:</p>

                <div class='otp'>{otp}</div>

                <p>This OTP is valid for <strong>15 minutes</strong>.</p>
            ");

            await SendAsync(email, subject, body);
        }

        // ======================================================
        // 2. PASSWORD CHANGED NOTIFICATION
        // ======================================================
        public async Task SendPasswordChangedNotificationAsync(
            string email,
            string firstName)
        {
            var subject = "Password Changed";

            var body = BuildBaseTemplate($@"
                <p>Hi <strong>{firstName}</strong>,</p>
                <p>Your password has been changed successfully.</p>
                <p>If you did not perform this action, please contact support immediately.</p>
            ");

            await SendAsync(email, subject, body);
        }

        // ======================================================
        // 3. VERIFY EMAIL
        // ======================================================
        public async Task SendVerifyEmailAsync(
            string email,
            string verifyLink)
        {
            var subject = "Verify Your Email";

            var body = BuildBaseTemplate($@"
                <p>Thank you for registering.</p>
                <p>Please verify your email address by clicking the button below:</p>

                <a href='{verifyLink}' class='button'>Verify Email</a>

                <p>If the button does not work, copy this link:</p>
                <p class='link'>{verifyLink}</p>
            ");

            await SendAsync(email, subject, body);
        }

        // ======================================================
        // BASE HTML TEMPLATE (DÙNG CHUNG)
        // ======================================================
        private string BuildBaseTemplate(string content)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset='UTF-8'>
            <style>
                body {{
                font-family: Arial, Helvetica, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
                color: #333;
                }}
                .container {{
                max-width: 520px;
                margin: 40px auto;
                background: #ffffff;
                border: 1px solid #e0e0e0;
                }}
                .header {{
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
                font-size: 18px;
                font-weight: bold;
                }}
                .content {{
                padding: 24px;
                font-size: 14px;
                line-height: 1.6;
                }}
                .otp {{
                margin: 24px 0;
                padding: 16px;
                text-align: center;
                font-size: 28px;
                letter-spacing: 6px;
                font-weight: bold;
                border: 1px dashed #ccc;
                background: #fafafa;
                }}
                .button {{
                display: inline-block;
                margin: 20px 0;
                padding: 10px 24px;
                border: 1px solid #333;
                text-decoration: none;
                color: #333;
                font-weight: bold;
                }}
                .link {{
                word-break: break-all;
                color: #666;
                font-size: 13px;
                }}
                .footer {{
                padding: 16px;
                font-size: 12px;
                color: #888;
                border-top: 1px solid #e0e0e0;
                text-align: center;
                }}
            </style>
            </head>
            <body>
            <div class='container'>
                <div class='header'>Account Notification</div>

                <div class='content'>
                {content}
                </div>

                <div class='footer'>
                This is an automated message. Please do not reply.
                </div>
            </div>
            </body>
            </html>";
        }

        // ======================================================
        // BASE SEND METHOD (SMTP)
        // ======================================================
        private async Task SendAsync(
            string to,
            string subject,
            string htmlBody)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _settings.SenderName,
                _settings.SenderEmail));

            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            message.Body = new BodyBuilder
            {
                HtmlBody = htmlBody
            }.ToMessageBody();

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(
                _settings.SmtpServer,
                _settings.SmtpPort,
                _settings.SecureSocketOptions);

            await smtp.AuthenticateAsync(
                _settings.Username,
                _settings.Password);

            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);
        }
    }
}
