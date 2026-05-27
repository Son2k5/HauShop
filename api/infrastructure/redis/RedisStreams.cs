namespace api.infrastructure.redis;

public static class RedisStreams
{
    public const string OrderEvents = "haushop:v1:streams:order-events";
    public const string NotificationJobs = "haushop:v1:streams:notification-jobs";
}
