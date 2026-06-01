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
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductVariantId = i.ProductVariantId,
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
                    Id = p.Id,
                    Method = p.Method.ToString(),
                    Status = p.Status.ToString(),
                    Amount = p.Amount,
                    TransactionNo = p.TransactionNo,

                    VnpTransactionId = p.ProviderTransactionId,
                    VnpResponseCode = p.ResponseCode,
                    VnpBankCode = p.BankCode,
                    VnpPayDate = p.PaidAt
                }).ToList() ?? new List<PaymentDto>(),

                Shipping = o.ShippingDetail == null ? null : new ShippingDetailDto
                {
                    Id = o.ShippingDetail.Id,
                    Method = o.ShippingDetail.Method.ToString(),
                    Fee = o.ShippingDetail.Fee,
                    TrackingNumber = o.ShippingDetail.TrackingNumber,
                    CarrierName = o.ShippingDetail.Carrier,
                    CarrierCode = o.ShippingDetail.CarrierCode,
                    CurrentLocation = o.ShippingDetail.CurrentLocation,
                    TrackingUrl = o.ShippingDetail.TrackingUrl,
                    EstimatedDelivery = o.ShippingDetail.EstimatedDelivery,
                    DeliveredAt = o.ShippingDetail.DeliveredAt,
                    TrackingEvents = o.ShippingDetail.TrackingEvents?
                        .OrderByDescending(e => e.OccurredAt)
                        .Select(e => new ShippingTrackingEventDto
                        {
                            Id = e.Id,
                            Status = e.Status.ToString(),
                            Title = e.Title,
                            Description = e.Description,
                            Location = e.Location,
                            TrackingNumber = e.TrackingNumber,
                            CarrierName = e.CarrierName,
                            OccurredAt = e.OccurredAt,
                            Created = e.Created
                        }).ToList() ?? new List<ShippingTrackingEventDto>()
                },

                StatusHistory = o.StatusHistories?
                    .OrderBy(h => h.Created)
                    .Select(h => new OrderStatusHistoryDto
                    {
                        Id = h.Id,
                        Status = h.Status.ToString(),
                        Title = h.Title,
                        Description = h.Description,
                        Location = h.Location,
                        Note = h.Note,
                        ActorUserId = h.ActorUserId,
                        ActorRole = h.ActorRole,
                        Created = h.Created
                    }).ToList() ?? new List<OrderStatusHistoryDto>()
            };
        }
    }
}
