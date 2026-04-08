using System.Security.Cryptography;
using System.Text;

namespace api.helpers
{
    public class HashRefreshToken
    {
        public static string Hash(string token)
        {
            using var sha = SHA256.Create();
            return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(token)));
        }
    }
}