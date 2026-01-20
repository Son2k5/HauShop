

namespace api.Services.Interfaces.Auth
{
    public interface IOtpService
    {
        string GenerateOtp();
        string HashOtp(string otp);
        bool VerifyOtp(string otp, string hash);
    }
}