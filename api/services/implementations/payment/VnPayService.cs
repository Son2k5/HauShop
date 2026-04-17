using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using api.middlewares;
using api.models.entities;
using api.services.interfaces.payment;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace api.services.implementations.payment
{
    public class VnPayService : IVnPayService
    {
        private readonly VnPayOptions _options;

        public VnPayService(IOptions<VnPayOptions> options)
        {
            _options = options.Value;
        }

        public string CreatePaymentUrl(HttpContext httpContext, Order order, Payment payment)
        {
            var vnTime = DateTime.UtcNow.AddHours(7);

            var parameters = new SortedDictionary<string, string>
            {
                ["vnp_Version"] = "2.1.0",
                ["vnp_Command"] = "pay",
                ["vnp_TmnCode"] = _options.TmnCode,
                ["vnp_Amount"] = ((long)(payment.Amount * 100)).ToString(),
                ["vnp_CreateDate"] = vnTime.ToString("yyyyMMddHHmmss"),
                ["vnp_CurrCode"] = "VND",
                ["vnp_IpAddr"] = GetIpAddress(httpContext),
                ["vnp_Locale"] = "vn",
                ["vnp_OrderInfo"] = payment.OrderInfo ?? $"Thanh toan don hang {order.Id}",
                ["vnp_OrderType"] = "other",
                ["vnp_ReturnUrl"] = _options.ReturnUrl,
                ["vnp_TxnRef"] = payment.TransactionNo
            };

            var queryString = string.Join("&",
                parameters.Select(kvp => $"{kvp.Key}={WebUtility.UrlEncode(kvp.Value)}"));

            var secureHash = ComputeHmacSha512(_options.HashSecret, queryString);

            return $"{_options.BaseUrl}?{queryString}&vnp_SecureHash={secureHash}";
        }

        public bool ValidateSignature(IQueryCollection query)
        {
            var rawParams = query
                .Where(x => x.Key.StartsWith("vnp_") &&
                            x.Key != "vnp_SecureHash" &&
                            x.Key != "vnp_SecureHashType")
                .ToDictionary(x => x.Key, x => x.Value.ToString());

            var sorted = new SortedDictionary<string, string>(rawParams);

            var signData = string.Join("&",
                sorted.Select(kvp => $"{kvp.Key}={WebUtility.UrlEncode(kvp.Value)}"));

            var computed = ComputeHmacSha512(_options.HashSecret, signData);
            var received = query["vnp_SecureHash"].ToString();

            return string.Equals(computed, received, StringComparison.OrdinalIgnoreCase);
        }

        public DateTime? ParsePayDate(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (DateTime.TryParseExact(
                value,
                "yyyyMMddHHmmss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var result))
            {
                return result;
            }

            return null;
        }

        private static string ComputeHmacSha512(string key, string inputData)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(inputData);

            using var hmac = new HMACSHA512(keyBytes);
            var hashBytes = hmac.ComputeHash(inputBytes);

            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        private static string GetIpAddress(HttpContext context)
        {
            var ip =
                context.Connection.RemoteIpAddress?.ToString() ??
                context.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                "127.0.0.1";

            return ip == "::1" ? "127.0.0.1" : ip;
        }
    }
}