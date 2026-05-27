using api.DTOs.product;
using api.infrastructure.redis;
using api.repositories.interfaces;
using api.services.interfaces.caching;
using api.services.interfaces.category;
using Microsoft.Extensions.Options;

namespace api.services.implementations.category;

public sealed class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _repository;
    private readonly IRedisCacheService _cache;
    private readonly RedisOptions _redisOptions;

    public CategoryService(
        ICategoryRepository repository,
        IRedisCacheService cache,
        IOptions<RedisOptions> redisOptions)
    {
        _repository = repository;
        _cache = cache;
        _redisOptions = redisOptions.Value;
    }

    public Task<List<CategoryDto>> GetAllAsync(CancellationToken ct = default)
    {
        return _cache.GetOrSetAsync(
            RedisCacheKeys.CategoryAll(),
            token => _repository.GetAllCategoryDtosAsync(token),
            TimeSpan.FromMinutes(_redisOptions.CategoryTtlMinutes),
            ct: ct);
    }

    public Task<List<CategorySummaryDto>> GetActiveAsync(CancellationToken ct = default)
    {
        return _cache.GetOrSetAsync(
            RedisCacheKeys.CategoryActive(),
            token => _repository.GetActiveCategorySummaryDtosAsync(token),
            TimeSpan.FromMinutes(_redisOptions.CategoryTtlMinutes),
            ct: ct);
    }
}
