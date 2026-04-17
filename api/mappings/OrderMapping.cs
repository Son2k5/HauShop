using System.Collections.Generic;
using System.Linq;
using api.DTOs.order;
using api.models.entities;

namespace api.mappings
{
    public class OrderMapping
    {
        public static OrderDto MapToDto(Order o)
        {
            return new OrderDto
            {
                Id = o.Id,
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee,
                Total = o.Total,
                Status = o.Status.ToString(),
                ReceiverName = o.ReceiverName,
                ReceiverPhone = o.ReceiverPhone,
                AddressLine = o.AddressLine,
                Created = o.Created,
                Updated = o.Updated,

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