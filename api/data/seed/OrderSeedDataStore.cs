using System;
using System.Collections.Generic;
using api.helpers;
using api.models.entities;
using api.models.enums;

namespace api.data.seed
{
    public static class OrderSeedDataStore
    {
        public const string CustomerUserId = "SEED-CUSTOMER-001";
        public const string CustomerAddressId = "SEED-ADDRESS-001";
        public const string CustomerOrderId = "SEED-ORDER-001";

        public static string[] UserIds => new[] { CustomerUserId };
        public static string[] AddressIds => new[] { CustomerAddressId };
        public static string[] OrderIds => new[] { CustomerOrderId };

        public static List<User> Users => new()
        {
            new()
            {
                Id = CustomerUserId,
                Email = "customer.seed@haushop.vn",
                PhoneNumber = "0909000001",
                FirstName = "Khach",
                LastName = "Hang Seed",
                PasswordHash = PasswordHasher.Hash("Customer@123"),
                Provider = Provider.Local,
                Role = Role.Member,
                IsOnline = false,
                Created = DateTime.UtcNow.AddDays(-30)
            }
        };

        public static List<Address> Addresses => new()
        {
            new()
            {
                Id = CustomerAddressId,
                UserId = CustomerUserId,
                AddressLine = "12 Nguyen Trai",
                City = "Ho Chi Minh",
                State = "Quan 1",
                Country = "Viet Nam",
                ZipCode = "700000",
                IsDefault = true,
                Created = DateTime.UtcNow.AddDays(-29)
            }
        };

        public static List<Order> Orders
        {
            get
            {
                var created = DateTime.UtcNow.AddDays(-2);
                var subtotal = 690000m;
                var shippingFee = 30000m;
                var total = subtotal + shippingFee;

                return new List<Order>
                {
                    new()
                    {
                        Id = CustomerOrderId,
                        UserId = CustomerUserId,
                        ShippingAddressId = CustomerAddressId,
                        Subtotal = subtotal,
                        ShippingFee = shippingFee,
                        Total = total,
                        Status = OrderStatus.OutForDelivery,
                        ReceiverName = "Khach Hang Seed",
                        ReceiverPhone = "0909000001",
                        AddressLine = "12 Nguyen Trai, Quan 1, Ho Chi Minh, Viet Nam",
                        Created = created,
                        Updated = created.AddHours(34),
                        OrderItems = new List<OrderItem>
                        {
                            new()
                            {
                                Id = "SEED-ORDER-ITEM-001",
                                OrderId = CustomerOrderId,
                                ProductId = "P1",
                                ProductVariantId = "V1_M_X",
                                ProductName = "Ao khoac gio nam the thao sieu nhe",
                                VariantSku = "AKN01-M-X",
                                VariantSize = "M",
                                VariantColor = "Xanh Navy",
                                Quantity = 1,
                                Price = 250000m,
                                Total = 250000m,
                                Created = created
                            },
                            new()
                            {
                                Id = "SEED-ORDER-ITEM-002",
                                OrderId = CustomerOrderId,
                                ProductId = "P10",
                                ProductVariantId = "V10_L_H",
                                ProductName = "Ao thun nam ombre tre trung",
                                VariantSku = "ATN10-L-H",
                                VariantSize = "L",
                                VariantColor = "Hong Trang",
                                Quantity = 2,
                                Price = 220000m,
                                Total = 440000m,
                                Created = created
                            }
                        },
                        Payments = new List<Payment>
                        {
                            new()
                            {
                                Id = "SEED-PAYMENT-001",
                                OrderId = CustomerOrderId,
                                Method = PaymentMethod.VNPay,
                                Status = PaymentStatus.Paid,
                                Amount = total,
                                TransactionNo = "SEED-VNPAY-000001",
                                Provider = "VNPay",
                                ProviderTransactionId = "VNPAY-SEED-000001",
                                ResponseCode = "00",
                                BankCode = "NCB",
                                OrderInfo = "Thanh toan don hang seed cho dashboard/admin",
                                Created = created.AddMinutes(5),
                                PaidAt = created.AddMinutes(8),
                                Updated = created.AddMinutes(8)
                            }
                        },
                        ShippingDetail = new ShippingDetail
                        {
                            Id = "SEED-SHIPPING-001",
                            OrderId = CustomerOrderId,
                            Method = ShippingMethod.Standard,
                            Fee = shippingFee,
                            TrackingNumber = "GHN-SEED-000001",
                            Carrier = "GHN",
                            CarrierCode = "GHN",
                            CurrentLocation = "Dang giao tai Quan 1",
                            TrackingUrl = "https://tracking.ghn.dev/seed/GHN-SEED-000001",
                            EstimatedDelivery = created.AddDays(3),
                            Created = created.AddHours(8),
                            Updated = created.AddHours(34),
                            TrackingEvents = new List<ShippingTrackingEvent>
                            {
                                CreateTrackingEvent(
                                    "SEED-TRACKING-001",
                                    OrderStatus.HandoverToCarrier,
                                    "Da ban giao don vi van chuyen",
                                    "Don hang da duoc ban giao cho GHN.",
                                    "Kho HauShop",
                                    created.AddHours(16)),
                                CreateTrackingEvent(
                                    "SEED-TRACKING-002",
                                    OrderStatus.InTransit,
                                    "Dang van chuyen",
                                    "Kien hang dang di chuyen qua kho trung chuyen.",
                                    "Kho trung chuyen Ho Chi Minh",
                                    created.AddHours(24)),
                                CreateTrackingEvent(
                                    "SEED-TRACKING-003",
                                    OrderStatus.OutForDelivery,
                                    "Dang giao hang",
                                    "Shipper dang giao kien hang den nguoi nhan.",
                                    "Dang giao tai Quan 1",
                                    created.AddHours(34))
                            }
                        },
                        StatusHistories = new List<OrderStatusHistory>
                        {
                            CreateStatusHistory(
                                "SEED-HISTORY-001",
                                OrderStatus.OrderPlaced,
                                "Da dat hang",
                                "Khach hang da dat don hang thanh cong.",
                                null,
                                created),
                            CreateStatusHistory(
                                "SEED-HISTORY-002",
                                OrderStatus.SellerConfirmed,
                                "Nguoi ban da xac nhan",
                                "Nguoi ban da tiep nhan va xac nhan don hang.",
                                "Kho HauShop",
                                created.AddHours(3)),
                            CreateStatusHistory(
                                "SEED-HISTORY-003",
                                OrderStatus.Packing,
                                "Dang dong goi",
                                "Don hang dang duoc dong goi.",
                                "Kho HauShop",
                                created.AddHours(8)),
                            CreateStatusHistory(
                                "SEED-HISTORY-004",
                                OrderStatus.HandoverToCarrier,
                                "Da giao cho don vi van chuyen",
                                "Don hang da duoc ban giao cho GHN.",
                                "Kho HauShop",
                                created.AddHours(16)),
                            CreateStatusHistory(
                                "SEED-HISTORY-005",
                                OrderStatus.InTransit,
                                "Dang van chuyen",
                                "Kien hang dang di chuyen qua kho trung chuyen.",
                                "Kho trung chuyen Ho Chi Minh",
                                created.AddHours(24)),
                            CreateStatusHistory(
                                "SEED-HISTORY-006",
                                OrderStatus.OutForDelivery,
                                "Dang giao hang",
                                "Shipper dang giao kien hang den nguoi nhan.",
                                "Dang giao tai Quan 1",
                                created.AddHours(34))
                        }
                    }
                };
            }
        }

        private static OrderStatusHistory CreateStatusHistory(
            string id,
            OrderStatus status,
            string title,
            string description,
            string? location,
            DateTime created)
        {
            return new OrderStatusHistory
            {
                Id = id,
                OrderId = CustomerOrderId,
                Status = status,
                Title = title,
                Description = description,
                Location = location,
                ActorRole = status == OrderStatus.OrderPlaced ? Role.Member.ToString() : Role.Admin.ToString(),
                Created = created
            };
        }

        private static ShippingTrackingEvent CreateTrackingEvent(
            string id,
            OrderStatus status,
            string title,
            string description,
            string location,
            DateTime occurredAt)
        {
            return new ShippingTrackingEvent
            {
                Id = id,
                ShippingDetailId = "SEED-SHIPPING-001",
                OrderId = CustomerOrderId,
                Status = status,
                Title = title,
                Description = description,
                Location = location,
                TrackingNumber = "GHN-SEED-000001",
                CarrierName = "GHN",
                OccurredAt = occurredAt,
                Created = occurredAt
            };
        }
    }
}
