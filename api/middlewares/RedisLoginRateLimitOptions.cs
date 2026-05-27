namespace api.middlewares;

public sealed class RedisLoginRateLimitOptions
{
    public string Path { get; set; } = "/api/auth/login";
    public int PermitLimit { get; set; } = 5;
    public int WindowSeconds { get; set; } = 300;
}
