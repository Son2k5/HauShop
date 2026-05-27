using System.Text;
using System.Text.Json;
using api.infrastructure.redis;
using api.services.interfaces.caching;
using Microsoft.Extensions.Options;

namespace api.middlewares;

public sealed class RedisLoginRateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly RedisLoginRateLimitOptions _options;
    private readonly ILogger<RedisLoginRateLimitMiddleware> _logger;

    public RedisLoginRateLimitMiddleware(
        RequestDelegate next,
        IOptions<RedisLoginRateLimitOptions> options,
        ILogger<RedisLoginRateLimitMiddleware> logger)
    {
        _next = next;
        _options = options.Value;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IRedisCacheService cache)
    {
        if (!IsLoginRequest(context.Request))
        {
            await _next(context);
            return;
        }

        try
        {
            var email = await TryReadEmailAsync(context.Request);
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var discriminator = $"{ip}:{email ?? "unknown"}";
            var key = RedisCacheKeys.LoginRateLimit(discriminator);

            var count = await cache.IncrementAsync(
                key,
                TimeSpan.FromSeconds(_options.WindowSeconds),
                context.RequestAborted);

            context.Response.Headers["X-RateLimit-Limit"] = _options.PermitLimit.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, _options.PermitLimit - count).ToString();

            if (count > _options.PermitLimit)
            {
                context.Response.Headers["Retry-After"] = _options.WindowSeconds.ToString();
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Too many login attempts. Please try again later."
                }, context.RequestAborted);

                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Login rate limit failed open.");
        }

        await _next(context);
    }

    private bool IsLoginRequest(HttpRequest request)
    {
        return HttpMethods.IsPost(request.Method) &&
               request.Path.StartsWithSegments(_options.Path, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<string?> TryReadEmailAsync(HttpRequest request)
    {
        if (request.Body == Stream.Null || request.ContentLength == 0)
            return null;

        if (request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) != true)
            return null;

        request.EnableBuffering();

        using var reader = new StreamReader(
            request.Body,
            Encoding.UTF8,
            detectEncodingFromByteOrderMarks: false,
            bufferSize: 1024,
            leaveOpen: true);

        var body = await reader.ReadToEndAsync();
        request.Body.Position = 0;

        if (string.IsNullOrWhiteSpace(body))
            return null;

        using var document = JsonDocument.Parse(body);
        return document.RootElement.TryGetProperty("email", out var emailElement)
            ? emailElement.GetString()?.Trim().ToLowerInvariant()
            : null;
    }
}
