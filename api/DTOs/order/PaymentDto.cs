namespace api.DTOs.order
{
    public class PaymentDto
    {
        public string Method { get; set; }
        public string Status { get; set; }

        public decimal Amount { get; set; }

        public string TransactionNo { get; set; }

        public string? VnpTransactionId { get; set; }
        public string? VnpResponseCode { get; set; }
        public string? VnpBankCode { get; set; }
        public DateTime? VnpPayDate { get; set; }
    }
}