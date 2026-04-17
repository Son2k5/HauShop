using System.Collections.Generic;
using System.Linq;
using api.DTOs.order;
using api.models.entities;

namespace api.mappings
{
    public class OrderMapper
    {
        public static OrderDto MapToOrderDto(Order o)
        {
            return new OrderDto
            {
                Id = o.Id,
                Total = o.Total,
                Status = o.Status.ToString(),
                Created = o.Created,

                Items = o.OrderItems?.Select(i => new OrderItemDto
                {
                    ProductName = i.ProductName,
                    VariantSku = i.VariantSku,
                    VariantSize = i.VariantSize,
                    VariantColor = i.VariantColor,
                    Quantity = i.Quantity,
                    Price = i.Price,
                    Total = i.Total
                }).ToList() ?? new List<OrderItemDto>(),

                Payments = o.Payments?.Select(p => new PaymentDto
                {
                    Method = p.Method.ToString(),
                    Status = p.Status.ToString(),
                    Amount = p.Amount,
                    TransactionNo = p.TransactionNo,

                    VnpTransactionId = p.ProviderTransactionId,
                    VnpResponseCode = p.ResponseCode,
                    VnpBankCode = p.BankCode,
                    VnpPayDate = p.PaidAt
                }).ToList() ?? new List<PaymentDto>()
            };
        }
    }
}