using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.enums;

namespace api.models.entities
{
    public class Payment
    {
        public string Id { get; set; }
        public string OrderId { get; set; }
        public Order Order { get; set; }
        public PaymentMethod Method { get; set; }
        public string TransactionNo { get; set; }
        public string VnpTransactionId { get; set; }
        public string VnpResponseCode { get; set; }
        public string VnpBankCode { get; set; }
        public DateTime? VnpPayDate { get; set; }
        public string VnpOrderInfo { get; set; }
        public decimal Amount { get; set; }
        public PaymentStatus Status { get; set; }
        public DateTime Created { get; set; }
    }
}
