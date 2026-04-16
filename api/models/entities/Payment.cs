using System;
using api.models.enums;

namespace api.models.entities
{
    public class Payment
    {
        public string Id { get; set; }
        public string OrderId { get; set; }
        public Order Order { get; set; }

        public PaymentMethod Method { get; set; }
        public PaymentStatus Status { get; set; }

        public decimal Amount { get; set; }

        public string TransactionNo { get; set; } // internal

        // generic cho VNPay / MoMo
        public string? Provider { get; set; }
        public string? ProviderTransactionId { get; set; }
        public string? ResponseCode { get; set; }
        public string? BankCode { get; set; }

        public string? OrderInfo { get; set; }

        public DateTime Created { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? Updated { get; set; }
    }
}