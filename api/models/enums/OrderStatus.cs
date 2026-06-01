namespace api.models.enums
{
    public enum OrderStatus
    {
        Pending = 0,
        Processing = 1,
        Shipping = 2,
        Completed = 3,
        Cancelled = 4,
        ReturnRequested = 5,
        ReturnApproved = 6,
        Returned = 7,
        Refunded = 8,
        PaymentSucceeded = 9,
        OrderPlaced = 10,
        SellerConfirmed = 11,
        Packing = 12,
        HandoverToCarrier = 13,
        InTransit = 14,
        OutForDelivery = 15,
        Delivered = 16,
        DeliveryFailed = 17,
        ReturnRejected = 18
    }
}
