using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using api.helpers;
using api.models.entities;
using api.models.enums;

namespace api.data.seed
{
    public static class OrderSeedDataStore
    {
        private const string SeedPassword = "Customer@123";

        private static readonly string[] LegacyUserIds = { "SEED-CUSTOMER-001" };
        private static readonly string[] LegacyAddressIds = { "SEED-ADDRESS-001" };
        private static readonly string[] LegacyOrderIds = { "SEED-ORDER-001" };

        private static readonly string[] FirstNames =
        {
            "An", "Binh", "Chi", "Duc", "Em", "Giang", "Ha", "Hieu", "Khanh", "Lam",
            "Linh", "Long", "Mai", "Minh", "Nam", "Ngoc", "Nhi", "Phong", "Phuc", "Quan",
            "Quynh", "Son", "Tam", "Thao", "Thien", "Thu", "Trang", "Trung", "Tu", "Vy",
            "Yen", "Bao", "Cuong", "Dat", "Hang", "Hanh", "Hoa", "Huy", "Kiet", "Loan"
        };

        private static readonly string[] LastNames =
        {
            "Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Vo", "Dang", "Bui", "Do",
            "Ho", "Ngo", "Duong", "Ly", "Truong", "Cao", "Phan", "Vu", "Ta", "Mai",
            "Dinh", "Lam", "Tong", "Luu", "Trinh", "Quach", "Luong", "Dao", "Chu", "Ha",
            "Thai", "To", "Diep", "La", "Than", "Khuu", "Mach", "Ong", "Cao", "Kim"
        };

        private static readonly (string Street, string State, string City, string ZipCode)[] AddressTemplates =
        {
            ("Nguyen Trai", "Quan 1", "Ho Chi Minh", "700000"),
            ("Le Loi", "Quan 3", "Ho Chi Minh", "700000"),
            ("Pham Van Dong", "Thu Duc", "Ho Chi Minh", "700000"),
            ("Vo Van Kiet", "Quan 5", "Ho Chi Minh", "700000"),
            ("Hai Ba Trung", "Hoan Kiem", "Ha Noi", "100000"),
            ("Nguyen Van Linh", "Hai Chau", "Da Nang", "550000"),
            ("Tran Phu", "Ninh Kieu", "Can Tho", "900000"),
            ("Le Hong Phong", "Ngo Quyen", "Hai Phong", "180000")
        };

        private static readonly OrderStatus[] StatusCycle =
        {
            OrderStatus.Pending,
            OrderStatus.OrderPlaced,
            OrderStatus.SellerConfirmed,
            OrderStatus.Packing,
            OrderStatus.HandoverToCarrier,
            OrderStatus.InTransit,
            OrderStatus.OutForDelivery,
            OrderStatus.Delivered,
            OrderStatus.Completed,
            OrderStatus.Cancelled,
            OrderStatus.ReturnRequested,
            OrderStatus.ReturnApproved,
            OrderStatus.Returned,
            OrderStatus.Refunded,
            OrderStatus.DeliveryFailed
        };

        private static readonly OrderStatus[] FulfillmentPath =
        {
            OrderStatus.OrderPlaced,
            OrderStatus.SellerConfirmed,
            OrderStatus.Packing,
            OrderStatus.HandoverToCarrier,
            OrderStatus.InTransit,
            OrderStatus.OutForDelivery,
            OrderStatus.Delivered,
            OrderStatus.Completed
        };

        private static readonly List<CustomerSeed> CustomerSeeds = BuildCustomers();

        public static string[] UserIds => CustomerSeeds
            .Select(customer => customer.UserId)
            .Concat(LegacyUserIds)
            .ToArray();

        public static string[] AddressIds => CustomerSeeds
            .Select(customer => customer.AddressId)
            .Concat(LegacyAddressIds)
            .ToArray();

        public static string[] OrderIds => CustomerSeeds
            .SelectMany(customer => Enumerable.Range(1, GetOrderCount(customer.Index))
                .Select(orderNo => GetOrderId(customer.Index, orderNo)))
            .Concat(LegacyOrderIds)
            .ToArray();

        public static List<User> Users
        {
            get
            {
                var passwordHash = PasswordHasher.Hash(SeedPassword);

                return CustomerSeeds.Select(customer => new User
                {
                    Id = customer.UserId,
                    Email = customer.Email,
                    PhoneNumber = customer.PhoneNumber,
                    FirstName = customer.FirstName,
                    LastName = customer.LastName,
                    PasswordHash = passwordHash,
                    Provider = Provider.Local,
                    Role = Role.Member,
                    IsOnline = false,
                    Created = DateTime.UtcNow.Date.AddDays(-90 + customer.Index)
                }).ToList();
            }
        }

        public static List<Address> Addresses => CustomerSeeds.Select(customer => new Address
        {
            Id = customer.AddressId,
            UserId = customer.UserId,
            AddressLine = customer.AddressLine,
            City = customer.City,
            State = customer.State,
            Country = "Viet Nam",
            ZipCode = customer.ZipCode,
            IsDefault = true,
            Created = DateTime.UtcNow.Date.AddDays(-89 + customer.Index)
        }).ToList();

        public static List<Order> Orders
        {
            get
            {
                var productsById = SeedDataStore.Products.ToDictionary(product => product.Id);
                var variants = SeedDataStore.ProductVariants;
                var orders = new List<Order>();

                foreach (var customer in CustomerSeeds)
                {
                    for (var orderNo = 1; orderNo <= GetOrderCount(customer.Index); orderNo++)
                    {
                        orders.Add(CreateOrder(customer, orderNo, productsById, variants));
                    }
                }

                return orders;
            }
        }

        private static List<CustomerSeed> BuildCustomers()
        {
            return Enumerable.Range(1, 40)
                .Select(index =>
                {
                    var address = AddressTemplates[(index - 1) % AddressTemplates.Length];

                    return new CustomerSeed
                    {
                        Index = index,
                        UserId = StableGuid($"haushop-seed-user-{index:00}"),
                        AddressId = StableGuid($"haushop-seed-address-{index:00}"),
                        FirstName = FirstNames[index - 1],
                        LastName = LastNames[index - 1],
                        Email = $"khachhang{index:00}@seed.haushop.vn",
                        PhoneNumber = $"09{(12000000 + index * 73421) % 100000000:00000000}",
                        AddressLine = $"{12 + index} {address.Street}",
                        State = address.State,
                        City = address.City,
                        ZipCode = address.ZipCode
                    };
                })
                .ToList();
        }

        private static Order CreateOrder(
            CustomerSeed customer,
            int orderNo,
            Dictionary<string, Product> productsById,
            List<ProductVariant> variants)
        {
            var orderId = GetOrderId(customer.Index, orderNo);
            var shippingId = StableGuid($"haushop-seed-shipping-{customer.Index:00}-{orderNo:00}");
            var created = DateTime.UtcNow.Date
                .AddDays(-((customer.Index * 3 + orderNo * 5) % 60))
                .AddHours(8 + ((customer.Index + orderNo) % 9));
            var status = StatusCycle[(customer.Index + orderNo - 2) % StatusCycle.Length];
            var paymentMethod = (customer.Index + orderNo) % 3 == 0 ? PaymentMethod.COD : PaymentMethod.VNPay;
            var items = CreateOrderItems(customer, orderNo, orderId, created, productsById, variants);
            var subtotal = items.Sum(item => item.Total);
            var shippingFee = 25000m + ((customer.Index + orderNo) % 4) * 5000m;
            var total = subtotal + shippingFee;
            var histories = CreateStatusHistories(customer, orderNo, orderId, status, created);
            var updated = histories.Count > 0 ? histories.Max(history => history.Created) : created;
            var trackingNumber = $"GHN-MOCK-{customer.Index:00}{orderNo:00}{(customer.Index * 37 + orderNo * 19) % 10000:0000}";
            var trackingEvents = CreateTrackingEvents(customer, orderNo, orderId, shippingId, trackingNumber, histories);

            return new Order
            {
                Id = orderId,
                UserId = customer.UserId,
                ShippingAddressId = customer.AddressId,
                Subtotal = subtotal,
                ShippingFee = shippingFee,
                Total = total,
                Status = status,
                ReceiverName = $"{customer.FirstName} {customer.LastName}",
                ReceiverPhone = customer.PhoneNumber,
                AddressLine = customer.FullAddress,
                Created = created,
                Updated = updated,
                OrderItems = items,
                Payments = new List<Payment>
                {
                    new()
                    {
                        Id = StableGuid($"haushop-seed-payment-{customer.Index:00}-{orderNo:00}"),
                        OrderId = orderId,
                        Method = paymentMethod,
                        Status = GetPaymentStatus(status),
                        Amount = total,
                        TransactionNo = $"PAY-{CompactId(orderId)}",
                        Provider = paymentMethod == PaymentMethod.VNPay ? "VNPay" : "COD",
                        ProviderTransactionId = paymentMethod == PaymentMethod.VNPay ? $"VNPAY-{CompactId(orderId)}" : null,
                        ResponseCode = GetPaymentStatus(status) == PaymentStatus.Paid ? "00" : null,
                        BankCode = paymentMethod == PaymentMethod.VNPay ? "NCB" : null,
                        OrderInfo = $"Thanh toan don hang mock {customer.Index:00}-{orderNo:00}",
                        Created = created.AddMinutes(5),
                        PaidAt = GetPaymentStatus(status) == PaymentStatus.Paid ? created.AddMinutes(8) : null,
                        Updated = created.AddMinutes(8)
                    }
                },
                ShippingDetail = new ShippingDetail
                {
                    Id = shippingId,
                    OrderId = orderId,
                    Method = paymentMethod == PaymentMethod.COD ? ShippingMethod.COD : ShippingMethod.Standard,
                    Fee = shippingFee,
                    TrackingNumber = trackingNumber,
                    Carrier = "GHN",
                    CarrierCode = "GHN",
                    CurrentLocation = GetCurrentLocation(status, customer),
                    TrackingUrl = $"https://tracking.ghn.dev/mock/{trackingNumber}",
                    EstimatedDelivery = created.AddDays(3 + ((customer.Index + orderNo) % 2)),
                    DeliveredAt = IsDeliveredStatus(status) ? updated : null,
                    Created = created.AddHours(6),
                    Updated = updated,
                    TrackingEvents = trackingEvents
                },
                StatusHistories = histories
            };
        }

        private static List<OrderItem> CreateOrderItems(
            CustomerSeed customer,
            int orderNo,
            string orderId,
            DateTime created,
            Dictionary<string, Product> productsById,
            List<ProductVariant> variants)
        {
            var lineCount = 1 + ((customer.Index + orderNo) % 3);
            var items = new List<OrderItem>();

            for (var lineIndex = 1; lineIndex <= lineCount; lineIndex++)
            {
                var variant = variants[(customer.Index * 7 + orderNo * 5 + lineIndex * 11) % variants.Count];
                var product = productsById[variant.ProductId];
                var quantity = 1 + ((customer.Index + orderNo + lineIndex) % 3);
                var total = variant.Price * quantity;

                items.Add(new OrderItem
                {
                    Id = StableGuid($"haushop-seed-order-item-{customer.Index:00}-{orderNo:00}-{lineIndex:00}"),
                    OrderId = orderId,
                    ProductId = product.Id,
                    ProductVariantId = variant.Id,
                    ProductName = product.Name,
                    VariantSku = variant.Sku,
                    VariantSize = variant.Size,
                    VariantColor = variant.Color,
                    Quantity = quantity,
                    Price = variant.Price,
                    Total = total,
                    Created = created.AddMinutes(lineIndex)
                });
            }

            return items;
        }

        private static List<OrderStatusHistory> CreateStatusHistories(
            CustomerSeed customer,
            int orderNo,
            string orderId,
            OrderStatus finalStatus,
            DateTime created)
        {
            var statuses = BuildHistoryStatuses(finalStatus);
            var histories = new List<OrderStatusHistory>();

            for (var index = 0; index < statuses.Count; index++)
            {
                var status = statuses[index];
                var copy = GetStatusCopy(status, customer);

                histories.Add(new OrderStatusHistory
                {
                    Id = StableGuid($"haushop-seed-history-{customer.Index:00}-{orderNo:00}-{index + 1:00}"),
                    OrderId = orderId,
                    Status = status,
                    Title = copy.Title,
                    Description = copy.Description,
                    Location = copy.Location,
                    ActorRole = IsCustomerStatus(status) ? Role.Member.ToString() : Role.Admin.ToString(),
                    Created = created.AddHours(index * 8)
                });
            }

            return histories;
        }

        private static List<ShippingTrackingEvent> CreateTrackingEvents(
            CustomerSeed customer,
            int orderNo,
            string orderId,
            string shippingId,
            string trackingNumber,
            List<OrderStatusHistory> histories)
        {
            return histories
                .Where(history => IsTrackingStatus(history.Status))
                .Select((history, index) => new ShippingTrackingEvent
                {
                    Id = StableGuid($"haushop-seed-tracking-{customer.Index:00}-{orderNo:00}-{index + 1:00}"),
                    ShippingDetailId = shippingId,
                    OrderId = orderId,
                    Status = history.Status,
                    Title = history.Title,
                    Description = history.Description,
                    Location = history.Location ?? customer.State,
                    TrackingNumber = trackingNumber,
                    CarrierName = "GHN",
                    OccurredAt = history.Created,
                    Created = history.Created
                })
                .ToList();
        }

        private static IReadOnlyList<OrderStatus> BuildHistoryStatuses(OrderStatus finalStatus)
        {
            return finalStatus switch
            {
                OrderStatus.Pending => new[] { OrderStatus.Pending },
                OrderStatus.Processing => new[] { OrderStatus.OrderPlaced, OrderStatus.SellerConfirmed },
                OrderStatus.Shipping => new[] { OrderStatus.OrderPlaced, OrderStatus.SellerConfirmed, OrderStatus.Packing, OrderStatus.HandoverToCarrier, OrderStatus.InTransit },
                OrderStatus.PaymentSucceeded => new[] { OrderStatus.OrderPlaced, OrderStatus.PaymentSucceeded },
                OrderStatus.Cancelled => new[] { OrderStatus.OrderPlaced, OrderStatus.Cancelled },
                OrderStatus.DeliveryFailed => new[] { OrderStatus.OrderPlaced, OrderStatus.SellerConfirmed, OrderStatus.Packing, OrderStatus.HandoverToCarrier, OrderStatus.InTransit, OrderStatus.DeliveryFailed },
                OrderStatus.ReturnRequested => FulfillmentPath.Concat(new[] { OrderStatus.ReturnRequested }).ToArray(),
                OrderStatus.ReturnApproved => FulfillmentPath.Concat(new[] { OrderStatus.ReturnRequested, OrderStatus.ReturnApproved }).ToArray(),
                OrderStatus.Returned => FulfillmentPath.Concat(new[] { OrderStatus.ReturnRequested, OrderStatus.ReturnApproved, OrderStatus.Returned }).ToArray(),
                OrderStatus.Refunded => FulfillmentPath.Concat(new[] { OrderStatus.ReturnRequested, OrderStatus.ReturnApproved, OrderStatus.Returned, OrderStatus.Refunded }).ToArray(),
                OrderStatus.ReturnRejected => FulfillmentPath.Concat(new[] { OrderStatus.ReturnRequested, OrderStatus.ReturnRejected }).ToArray(),
                _ => BuildFulfillmentHistory(finalStatus)
            };
        }

        private static IReadOnlyList<OrderStatus> BuildFulfillmentHistory(OrderStatus finalStatus)
        {
            var index = Array.IndexOf(FulfillmentPath, finalStatus);
            return index < 0 ? new[] { finalStatus } : FulfillmentPath.Take(index + 1).ToArray();
        }

        private static (string Title, string Description, string? Location) GetStatusCopy(OrderStatus status, CustomerSeed customer)
        {
            return status switch
            {
                OrderStatus.Pending => ("Dang cho xu ly", "Don hang dang cho he thong xac nhan.", null),
                OrderStatus.PaymentSucceeded => ("Da thanh toan", "Thanh toan don hang da duoc ghi nhan.", null),
                OrderStatus.OrderPlaced => ("Da dat hang", "Khach hang da dat don hang thanh cong.", null),
                OrderStatus.SellerConfirmed => ("Nguoi ban da xac nhan", "Nguoi ban da tiep nhan va xac nhan don hang.", "Kho HauShop"),
                OrderStatus.Packing => ("Dang dong goi", "Don hang dang duoc dong goi.", "Kho HauShop"),
                OrderStatus.HandoverToCarrier => ("Da giao cho don vi van chuyen", "Don hang da duoc ban giao cho GHN.", "Kho HauShop"),
                OrderStatus.InTransit => ("Dang van chuyen", "Kien hang dang di chuyen qua kho trung chuyen.", $"Kho trung chuyen {customer.City}"),
                OrderStatus.OutForDelivery => ("Dang giao hang", "Shipper dang giao kien hang den nguoi nhan.", $"Dang giao tai {customer.State}"),
                OrderStatus.Delivered => ("Da giao hang", "Don hang da giao thanh cong cho nguoi nhan.", customer.State),
                OrderStatus.Completed => ("Da hoan thanh", "Don hang da hoan tat.", customer.State),
                OrderStatus.Cancelled => ("Da huy", "Don hang da duoc huy theo yeu cau.", null),
                OrderStatus.DeliveryFailed => ("Giao hang that bai", "Don vi van chuyen chua giao duoc kien hang.", customer.State),
                OrderStatus.ReturnRequested => ("Yeu cau tra hang", "Khach hang da gui yeu cau tra hang.", customer.State),
                OrderStatus.ReturnApproved => ("Da duyet tra hang", "Nguoi ban da chap thuan yeu cau tra hang.", "Kho HauShop"),
                OrderStatus.Returned => ("Da nhan hang tra", "Kho da tiep nhan kien hang tra.", "Kho HauShop"),
                OrderStatus.Refunded => ("Da hoan tien", "He thong da ghi nhan hoan tien cho khach hang.", null),
                OrderStatus.ReturnRejected => ("Tu choi tra hang", "Nguoi ban da tu choi yeu cau tra hang.", "Kho HauShop"),
                _ => (status.ToString(), "Don hang da duoc cap nhat trang thai.", null)
            };
        }

        private static PaymentStatus GetPaymentStatus(OrderStatus status)
        {
            return status switch
            {
                OrderStatus.Pending or OrderStatus.OrderPlaced or OrderStatus.SellerConfirmed => PaymentStatus.Pending,
                OrderStatus.Cancelled or OrderStatus.DeliveryFailed => PaymentStatus.Failed,
                _ => PaymentStatus.Paid
            };
        }

        private static string GetCurrentLocation(OrderStatus status, CustomerSeed customer)
        {
            return status switch
            {
                OrderStatus.Pending or OrderStatus.OrderPlaced or OrderStatus.SellerConfirmed or OrderStatus.Packing => "Kho HauShop",
                OrderStatus.HandoverToCarrier => "Kho HauShop",
                OrderStatus.InTransit => $"Kho trung chuyen {customer.City}",
                OrderStatus.OutForDelivery => $"Dang giao tai {customer.State}",
                OrderStatus.Delivered or OrderStatus.Completed => customer.State,
                OrderStatus.Cancelled => "Don hang da huy",
                OrderStatus.DeliveryFailed => $"Can xu ly tai {customer.State}",
                OrderStatus.ReturnRequested or OrderStatus.ReturnApproved or OrderStatus.Returned or OrderStatus.Refunded or OrderStatus.ReturnRejected => "Kho HauShop",
                _ => customer.City
            };
        }

        private static bool IsTrackingStatus(OrderStatus status)
        {
            return status is OrderStatus.HandoverToCarrier
                or OrderStatus.InTransit
                or OrderStatus.OutForDelivery
                or OrderStatus.Delivered
                or OrderStatus.Completed
                or OrderStatus.DeliveryFailed
                or OrderStatus.ReturnApproved
                or OrderStatus.Returned;
        }

        private static bool IsDeliveredStatus(OrderStatus status)
        {
            return status is OrderStatus.Delivered
                or OrderStatus.Completed
                or OrderStatus.ReturnRequested
                or OrderStatus.ReturnApproved
                or OrderStatus.Returned
                or OrderStatus.Refunded
                or OrderStatus.ReturnRejected;
        }

        private static bool IsCustomerStatus(OrderStatus status)
        {
            return status is OrderStatus.Pending
                or OrderStatus.OrderPlaced
                or OrderStatus.ReturnRequested;
        }

        private static int GetOrderCount(int customerIndex)
        {
            return 1 + ((customerIndex - 1) % 4);
        }

        private static string GetOrderId(int customerIndex, int orderNo)
        {
            return StableGuid($"haushop-seed-order-{customerIndex:00}-{orderNo:00}");
        }

        private static string StableGuid(string value)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
            var bytes = new byte[16];
            Array.Copy(hash, bytes, bytes.Length);
            return new Guid(bytes).ToString();
        }

        private static string CompactId(string id)
        {
            return id.Replace("-", string.Empty).Substring(0, 12).ToUpperInvariant();
        }

        private sealed class CustomerSeed
        {
            public int Index { get; init; }
            public string UserId { get; init; } = string.Empty;
            public string AddressId { get; init; } = string.Empty;
            public string FirstName { get; init; } = string.Empty;
            public string LastName { get; init; } = string.Empty;
            public string Email { get; init; } = string.Empty;
            public string PhoneNumber { get; init; } = string.Empty;
            public string AddressLine { get; init; } = string.Empty;
            public string State { get; init; } = string.Empty;
            public string City { get; init; } = string.Empty;
            public string ZipCode { get; init; } = string.Empty;
            public string FullAddress => $"{AddressLine}, {State}, {City}, Viet Nam";
        }
    }
}
