using api.DTOs.cart;
using api.services.interfaces.caching;
using api.services.interfaces.cart;
using Microsoft.Extensions.Options;

namespace api.services.implementations.cart;

public sealed class CartCacheService : ICartCacheService
{
    private readonly ICacheService _cache;
    private readonly CacheOptions _cacheOptions;

    public CartCacheService(ICacheService cache, IOptions<CacheOptions> cacheOptions)
    {
        _cache = cache;
        _cacheOptions = cacheOptions.Value;
    }

    public Task<CartDto?> GetUserCartAsync(string userId, CancellationToken ct = default)
    {
        return _cache.GetAsync<CartDto>(CacheKeys.UserCart(userId), ct);
    }

    public Task SetUserCartAsync(string userId, CartDto cart, CancellationToken ct = default)
    {
        return _cache.SetAsync(
            CacheKeys.UserCart(userId),
            cart,
            TimeSpan.FromHours(_cacheOptions.CartTtlHours),
            TimeSpan.FromHours(6),
            ct);
    }

    public Task RemoveUserCartAsync(string userId, CancellationToken ct = default)
    {
        return _cache.RemoveAsync(CacheKeys.UserCart(userId), ct);
    }
}
