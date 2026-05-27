namespace api.events;

public static class EventTopics
{
    public const string OrderCreatedChannel = "haushop:v1:events:order-created";
    public const string InventoryChangedChannel = "haushop:v1:events:inventory-changed";
    public const string NotificationChannel = "haushop:v1:events:notification";

    public const string OrderEventsStream = "haushop:v1:streams:order-events";
    public const string NotificationJobsStream = "haushop:v1:streams:notification-jobs";
}
