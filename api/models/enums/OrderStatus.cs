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
        Refunded = 8
    }
}
