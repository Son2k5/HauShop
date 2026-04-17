using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.middlewares
{
    public class VnPayOptions
    {
        public const string SectionName = "VnPay";

        public string TmnCode { get; set; } = string.Empty;
        public string HashSecret { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        public string ReturnUrl { get; set; } = string.Empty;
    }
}