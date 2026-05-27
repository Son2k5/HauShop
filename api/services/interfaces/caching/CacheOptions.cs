namespace api.services.interfaces.caching;

public sealed class CacheOptions
{
    public int ProductListTtlMinutes { get; set; } = 10;
    public int ProductDetailTtlMinutes { get; set; } = 30;
    public int CategoryTtlMinutes { get; set; } = 60;
    public int HomepageTtlMinutes { get; set; } = 5;
    public int CartTtlHours { get; set; } = 24;
    public int OtpTtlMinutes { get; set; } = 15;
}
