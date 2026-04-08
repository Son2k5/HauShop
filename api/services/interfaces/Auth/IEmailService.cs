namespace api.services.interfaces.auth
{
    public interface IEmailService
    {
        Task SendPasswordResetOtpAsync(
            string email,
            string firstName,
            string otp);

        Task SendPasswordChangedNotificationAsync(
            string email,
            string firstName);

        Task SendVerifyEmailAsync(
            string email,
            string verifyLink);
    }
}
