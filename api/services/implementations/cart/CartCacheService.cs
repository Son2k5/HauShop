using api.DTOs.cart;
using api.infrastructure.redis;
using api.services.interfaces.caching;
using api.services.interfaces.cart;
using Microsoft.Extensions.Options;

namespace api.services.implementations.cart;

public sealed class CartCacheService : ICartCacheService
{
    private readonly IRedisCacheService _cache;
    private readonly RedisOptions _redisOptions;

    public CartCacheService(IRedisCacheService cache, IOptions<RedisOptions> redisOptions)
    {
        _cache = cache;
        _redisOptions = redisOptions.Value;
    }

    public Task<CartDto?> GetUserCartAsync(string userId, CancellationToken ct = default)
    {
        return _cache.GetAsync<CartDto>(RedisCacheKeys.UserCart(userId), ct);
    }

    public Task SetUserCartAsync(string userId, CartDto cart, CancellationToken ct = default)
    {
        return _cache.SetAsync(
            RedisCacheKeys.UserCart(userId),
            cart,
            TimeSpan.FromHours(_redisOptions.CartTtlHours),
            TimeSpan.FromHours(6),
            ct);
    }

    public Task RemoveUserCartAsync(string userId, CancellationToken ct = default)
    {
        return _cache.RemoveAsync(RedisCacheKeys.UserCart(userId), ct);
    }
}
