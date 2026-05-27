namespace api.infrastructure.redis;

public static class RedisChannels
{
    public const string OrderCreated = "haushop:v1:events:order-created";
    public const string InventoryChanged = "haushop:v1:events:inventory-changed";
    public const string Notification = "haushop:v1:events:notification";
}
