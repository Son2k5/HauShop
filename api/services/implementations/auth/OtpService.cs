
using System.Security.Cryptography;
using System.Text;
using api.services.interfaces.auth;


namespace api.services.implementations.auth
{
    public class OtpService : IOtpService
    {
        public string GenerateOtp()
        {
            return RandomNumberGenerator
                .GetInt32(100000, 999999)
                .ToString();
        }

        public string HashOtp(string otp)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(otp));
            return Convert.ToBase64String(bytes);
        }

        public bool VerifyOtp(string otp, string hash)
        {
            return HashOtp(otp) == hash;
        }
    }
}