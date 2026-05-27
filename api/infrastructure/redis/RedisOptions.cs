namespace api.infrastructure.redis;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    public string Configuration { get; set; } = "127.0.0.1:6379,abortConnect=false";
    public string InstanceName { get; set; } = "haushop:";
    public int ProductListTtlMinutes { get; set; } = 10;
    public int ProductDetailTtlMinutes { get; set; } = 30;
    public int CategoryTtlMinutes { get; set; } = 60;
    public int HomepageTtlMinutes { get; set; } = 5;
    public int CartTtlHours { get; set; } = 24;
    public int OtpTtlMinutes { get; set; } = 15;
}
