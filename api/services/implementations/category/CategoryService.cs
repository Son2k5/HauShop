using api.DTOs.product;
using api.repositories.interfaces;
using api.services.interfaces.caching;
using api.services.interfaces.category;
using Microsoft.Extensions.Options;

namespace api.services.implementations.category;

public sealed class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _repository;
    private readonly ICacheService _cache;
    private readonly CacheOptions _cacheOptions;

    public CategoryService(
        ICategoryRepository repository,
        ICacheService cache,
        IOptions<CacheOptions> cacheOptions)
    {
        _repository = repository;
        _cache = cache;
        _cacheOptions = cacheOptions.Value;
    }

    public Task<List<CategoryDto>> GetAllAsync(CancellationToken ct = default)
    {
        return _cache.GetOrSetAsync(
            CacheKeys.CategoryAll(),
            token => _repository.GetAllCategoryDtosAsync(token),
            TimeSpan.FromMinutes(_cacheOptions.CategoryTtlMinutes),
            ct: ct);
    }

    public Task<List<CategorySummaryDto>> GetActiveAsync(CancellationToken ct = default)
    {
        return _cache.GetOrSetAsync(
            CacheKeys.CategoryActive(),
            token => _repository.GetActiveCategorySummaryDtosAsync(token),
            TimeSpan.FromMinutes(_cacheOptions.CategoryTtlMinutes),
            ct: ct);
    }
}
