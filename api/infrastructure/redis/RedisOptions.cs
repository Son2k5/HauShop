using api.middlewares;
using api.services.implementations.auth;
using api.services.implementations.caching;
using api.services.interfaces.auth;
using api.services.interfaces.caching;
using StackExchange.Redis;

namespace api.infrastructure.redis;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    public string Configuration { get; set; } = "127.0.0.1:6379,abortConnect=false";
}

public static class RedisServiceCollectionExtensions
{
    public static IServiceCollection AddRedisInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<RedisOptions>(configuration.GetSection(RedisOptions.SectionName));
        services.Configure<CacheOptions>(
            configuration.GetSection("Cache").Exists()
                ? configuration.GetSection("Cache")
                : configuration.GetSection(RedisOptions.SectionName));
        services.Configure<RedisLoginRateLimitOptions>(configuration.GetSection("RateLimiting:Login"));

        var redisOptions = configuration.GetSection(RedisOptions.SectionName).Get<RedisOptions>()
            ?? new RedisOptions();

        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("Redis");
            var options = BuildRedisConfiguration(redisOptions.Configuration);

            var redis = ConnectionMultiplexer.Connect(options);

            redis.ConnectionFailed += (_, args) =>
                logger.LogWarning(args.Exception, "Redis connection failed. Endpoint={Endpoint} FailureType={FailureType}",
                    args.EndPoint, args.FailureType);

            redis.ConnectionRestored += (_, args) =>
                logger.LogInformation("Redis connection restored. Endpoint={Endpoint} FailureType={FailureType}",
                    args.EndPoint, args.FailureType);

            redis.ErrorMessage += (_, args) =>
                logger.LogWarning("Redis error. Endpoint={Endpoint} Message={Message}", args.EndPoint, args.Message);

            return redis;
        });

        services.AddSingleton<ICacheService, RedisCacheService>();
        services.AddSingleton<IEventBus, RedisEventBus>();
        services.AddSingleton<IAuthTokenCacheService, AuthTokenCacheService>();
        services.AddSingleton<IJwtBlacklistService, JwtBlacklistService>();

        return services;
    }

    public static IApplicationBuilder UseRedisInfrastructure(this IApplicationBuilder app)
    {
        app.UseMiddleware<RedisLoginRateLimitMiddleware>();
        return app;
    }

    private static ConfigurationOptions BuildRedisConfiguration(string configuration)
    {
        var options = ConfigurationOptions.Parse(configuration, ignoreUnknown: true);

        options.AbortOnConnectFail = false;
        options.ConnectRetry = 1;
        options.ConnectTimeout = 1000;
        options.SyncTimeout = 1000;
        options.AsyncTimeout = 1000;
        options.KeepAlive = 30;
        options.BacklogPolicy = BacklogPolicy.FailFast;
        options.ReconnectRetryPolicy = new ExponentialRetry(500);

        return options;
    }
}
