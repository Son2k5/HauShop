namespace api.infrastructure.redis;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    public string Configuration { get; set; } = "127.0.0.1:6379,abortConnect=false";
}
