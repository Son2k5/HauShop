using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using api.DTOs.product;
using api.infrastructure.redis;
using api.mappings;
using api.models.entities;
using api.repositories.interfaces;
using api.services.interfaces.caching;
using api.services.interfaces.cloud;
using api.services.interfaces.product;
using Microsoft.Extensions.Options;

namespace api.services.implementations.product
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _repo;
        private readonly ICloudinaryService _cloudinary;
        private readonly IRedisCacheService _cache;
        private readonly RedisOptions _redisOptions;
        private readonly ILogger<ProductService> _logger;

        public ProductService(
            IProductRepository repo,
            ICloudinaryService cloudinary,
            IRedisCacheService cache,
            IOptions<RedisOptions> redisOptions,
            ILogger<ProductService> logger)
        {
            _repo = repo;
            _cloudinary = cloudinary;
            _cache = cache;
            _redisOptions = redisOptions.Value;
            _logger = logger;
        }

        public async Task<PagedProductDto> GetProductsAsync(
            ProductQueryDto query,
            CancellationToken ct = default)
        {
            var cacheKey = RedisCacheKeys.ProductList(query);
            var stopwatch = Stopwatch.StartNew();

            if (ShouldBypassProductListCache(query))
            {
                var uncachedResult = await LoadProductsFromRepositoryAsync(query, ct);
                stopwatch.Stop();

                if (stopwatch.ElapsedMilliseconds > 500)
                {
                    _logger.LogInformation(
                        "Uncached product search completed in {ElapsedMs}ms. Search={Search} Page={Page} PageSize={PageSize} IncludeTotal={IncludeTotal}",
                        stopwatch.ElapsedMilliseconds,
                        query.Search,
                        query.Page,
                        query.PageSize,
                        query.IncludeTotal);
                }

                return uncachedResult;
            }

            var result = await _cache.GetOrSetAsync(
                cacheKey,
                token => LoadProductsFromRepositoryAsync(query, token),
                TimeSpan.FromMinutes(_redisOptions.ProductListTtlMinutes),
                ct: ct);

            stopwatch.Stop();
            if (stopwatch.ElapsedMilliseconds > 500)
            {
                _logger.LogInformation(
                    "Product search completed in {ElapsedMs}ms. Search={Search} Page={Page} PageSize={PageSize} IncludeTotal={IncludeTotal}",
                    stopwatch.ElapsedMilliseconds,
                    query.Search,
                    query.Page,
                    query.PageSize,
                    query.IncludeTotal);
            }

            return result;
        }

        private async Task<PagedProductDto> LoadProductsFromRepositoryAsync(
            ProductQueryDto query,
            CancellationToken ct)
        {
            var dbStopwatch = Stopwatch.StartNew();
            PagedProductDto value;

            if (IsLatestHomepageQuery(query))
            {
                var items = await _repo.GetLatestActiveSummariesAsync(query.PageSize, ct);
                value = new PagedProductDto
                {
                    Items = items,
                    Total = 0,
                    Page = 1,
                    PageSize = Math.Clamp(query.PageSize, 1, 100),
                    HasNextPage = false,
                };
            }
            else
            {
                var (items, total, hasNextPage) = await _repo.GetPagedAsync(query, ct);

                value = new PagedProductDto
                {
                    Items = items,
                    Total = total,
                    Page = Math.Max(query.Page, 1),
                    PageSize = Math.Clamp(query.PageSize, 1, 100),
                    HasNextPage = hasNextPage,
                };
            }

            dbStopwatch.Stop();
            _logger.LogInformation(
                "Product search loaded from MySQL in {ElapsedMs}ms. Search={Search} Page={Page} PageSize={PageSize} IncludeTotal={IncludeTotal}",
                dbStopwatch.ElapsedMilliseconds,
                query.Search,
                query.Page,
                query.PageSize,
                query.IncludeTotal);

            return value;
        }

        public async Task<ProductDto> GetByIdAsync(string id, CancellationToken ct = default)
        {
            return await _cache.GetOrSetAsync(
                RedisCacheKeys.ProductDetail(id),
                async token =>
                {
                    var product = await _repo.GetByIdWithIncludesAsync(id, token)
                        ?? throw new KeyNotFoundException($"Product not found: {id}");

                    return ProductMapping.MapToDto(product);
                },
                TimeSpan.FromMinutes(_redisOptions.ProductDetailTtlMinutes),
                ct: ct);
        }

        public async Task<ProductDto> GetBySlugAsync(string slug, CancellationToken ct = default)
        {
            return await _cache.GetOrSetAsync(
                RedisCacheKeys.ProductSlug(slug),
                async token =>
                {
                    var product = await _repo.GetBySlugAsync(slug, token)
                        ?? throw new KeyNotFoundException($"Product not found: {slug}");

                    return ProductMapping.MapToDto(product);
                },
                TimeSpan.FromMinutes(_redisOptions.ProductDetailTtlMinutes),
                ct: ct);
        }

        public async Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken ct = default)
        {
            if (await _repo.ExistsSkuAsync(dto.Sku, ct: ct))
                throw new InvalidOperationException($"SKU '{dto.Sku}' already exists");

            var slug = BuildSlug(dto.Slug ?? dto.Name);
            if (await _repo.ExistsSlugAsync(slug, ct: ct))
                slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";

            var product = new Product
            {
                Id = Guid.NewGuid().ToString(),
                Sku = dto.Sku.Trim(),
                Name = dto.Name.Trim(),
                Slug = slug,
                Description = dto.Description?.Trim() ?? string.Empty,
                Price = dto.Price,
                Taxable = dto.Taxable,
                IsActive = dto.IsActive,
                BrandId = string.IsNullOrEmpty(dto.BrandId) ? null : dto.BrandId,
                ImageUrl = dto.ImageUrl ?? string.Empty,
                ImageKey = dto.ImageKey ?? string.Empty,
                Stock = dto.Stock,
                Created = DateTime.UtcNow,
            };

            _repo.Add(product);
            await _repo.SaveChangesAsync(ct);

            if (dto.CategoryIds?.Count > 0 == true)
                await _repo.SyncCategoriesAsync(product.Id, dto.CategoryIds, ct);

            var createdProduct = await _repo.GetByIdWithIncludesAsync(product.Id, ct)
                ?? throw new InvalidOperationException("Failed to retrieve created product");

            await InvalidateProductCollectionsAsync(ct);

            _logger.LogInformation("Product created: {Id} | {Sku} | {Name}",
                product.Id, product.Sku, product.Name);

            return ProductMapping.MapToDto(createdProduct);
        }

        public async Task<ProductDto> UpdateAsync(
            string id,
            UpdateProductDto dto,
            CancellationToken ct = default)
        {
            var product = await _repo.GetByIdAsync(id, ct)
                ?? throw new KeyNotFoundException($"Product not found: {id}");

            var oldSlug = product.Slug;

            if (dto.Sku != null && dto.Sku != product.Sku)
            {
                if (await _repo.ExistsSkuAsync(dto.Sku, id, ct))
                    throw new InvalidOperationException($"SKU '{dto.Sku}' already exists");
                product.Sku = dto.Sku.Trim();
            }

            if (dto.Name != null)
            {
                product.Name = dto.Name.Trim();

                if (dto.Slug == null)
                {
                    var autoSlug = BuildSlug(product.Name);
                    if (autoSlug != product.Slug && await _repo.ExistsSlugAsync(autoSlug, id, ct))
                        autoSlug = $"{autoSlug}-{Guid.NewGuid().ToString("N")[..6]}";
                    product.Slug = autoSlug;
                }
            }

            if (dto.Slug != null)
            {
                var newSlug = BuildSlug(dto.Slug);
                if (newSlug != product.Slug && await _repo.ExistsSlugAsync(newSlug, id, ct))
                    throw new InvalidOperationException($"Slug '{newSlug}' already exists");
                product.Slug = newSlug;
            }

            if (dto.Description != null) product.Description = dto.Description.Trim();
            if (dto.Price.HasValue) product.Price = dto.Price.Value;
            if (dto.Taxable.HasValue) product.Taxable = dto.Taxable.Value;
            if (dto.IsActive.HasValue) product.IsActive = dto.IsActive.Value;
            if (dto.Stock.HasValue) product.Stock = dto.Stock.Value;

            if (dto.BrandId != null)
                product.BrandId = dto.BrandId == "null" ? null : dto.BrandId;

            var oldImageKey = product.ImageKey;
            if (!string.IsNullOrEmpty(dto.ImageKey) &&
                !string.Equals(dto.ImageKey, product.ImageKey, StringComparison.Ordinal))
            {
                product.ImageKey = dto.ImageKey;
                product.ImageUrl = dto.ImageUrl ?? string.Empty;
            }

            product.Updated = DateTime.UtcNow;
            _repo.Update(product);
            await _repo.SaveChangesAsync(ct);

            if (!string.IsNullOrEmpty(oldImageKey) &&
                !string.Equals(oldImageKey, product.ImageKey, StringComparison.Ordinal))
            {
                try
                {
                    await _cloudinary.DeleteAsync(oldImageKey);
                    _logger.LogInformation("Deleted old Cloudinary image: {Key}", oldImageKey);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete old Cloudinary image {Key}", oldImageKey);
                }
            }

            if (dto.CategoryIds != null)
                await _repo.SyncCategoriesAsync(id, dto.CategoryIds, ct);

            var updatedProduct = await _repo.GetByIdWithIncludesAsync(id, ct)
                ?? throw new InvalidOperationException("Failed to retrieve updated product");

            await InvalidateProductAsync(id, oldSlug, ct);
            await InvalidateProductAsync(id, updatedProduct.Slug, ct);

            _logger.LogInformation("Product updated: {Id} | {Name}", product.Id, product.Name);

            return ProductMapping.MapToDto(updatedProduct);
        }

        public async Task DeleteAsync(string id, CancellationToken ct = default)
        {
            var product = await _repo.GetByIdAsync(id, ct)
                ?? throw new KeyNotFoundException($"Product not found: {id}");

            var imageKey = product.ImageKey;
            var slug = product.Slug;

            _repo.Delete(product);
            await _repo.SaveChangesAsync(ct);

            if (!string.IsNullOrEmpty(imageKey))
            {
                try
                {
                    await _cloudinary.DeleteAsync(imageKey);
                    _logger.LogInformation("Deleted Cloudinary image: {Key}", imageKey);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete Cloudinary image {Key}, but product deleted", imageKey);
                }
            }

            await InvalidateProductAsync(id, slug, ct);

            _logger.LogInformation("Product deleted: {Id}", id);
        }

        public async Task<ProductDto> ToggleActiveAsync(string id, CancellationToken ct = default)
        {
            var product = await _repo.GetByIdAsync(id, ct)
                ?? throw new KeyNotFoundException($"Product not found: {id}");

            product.IsActive = !product.IsActive;
            product.Updated = DateTime.UtcNow;

            _repo.Update(product);
            await _repo.SaveChangesAsync(ct);

            var toggledProduct = await _repo.GetByIdWithIncludesAsync(id, ct)
                ?? throw new InvalidOperationException("Failed to retrieve toggled product");

            await InvalidateProductAsync(id, toggledProduct.Slug, ct);

            _logger.LogInformation("Product toggled: {Id} -> IsActive={IsActive}",
                product.Id, product.IsActive);

            return ProductMapping.MapToDto(toggledProduct);
        }

        private async Task InvalidateProductAsync(string productId, string? slug, CancellationToken ct)
        {
            await _cache.RemoveAsync(RedisCacheKeys.ProductDetail(productId), ct);

            if (!string.IsNullOrWhiteSpace(slug))
                await _cache.RemoveAsync(RedisCacheKeys.ProductSlug(slug), ct);

            await InvalidateProductCollectionsAsync(ct);
        }

        private async Task InvalidateProductCollectionsAsync(CancellationToken ct)
        {
            await _cache.RemoveByPrefixAsync(RedisCacheKeys.ProductListPrefix, ct);
            await _cache.RemoveByPrefixAsync(RedisCacheKeys.HomepagePrefix, ct);
        }

        private static bool ShouldBypassProductListCache(ProductQueryDto query)
        {
            return !string.IsNullOrWhiteSpace(query.Search)
                && query.IncludeTotal == false
                && query.Page <= 1
                && query.PageSize <= 5;
        }

        private static bool IsLatestHomepageQuery(ProductQueryDto query)
        {
            return query.Page <= 1
                && query.PageSize <= 12
                && query.IncludeTotal == false
                && query.IsActive == true
                && string.IsNullOrWhiteSpace(query.Search)
                && string.IsNullOrWhiteSpace(query.BrandId)
                && string.IsNullOrWhiteSpace(query.CategoryId)
                && !query.MinPrice.HasValue
                && !query.MaxPrice.HasValue
                && string.Equals(query.SortBy, "created", StringComparison.OrdinalIgnoreCase)
                && string.Equals(query.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
        }

        private static string BuildSlug(string input)
        {
            var normalized = input.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);

            foreach (var c in normalized)
            {
                var category = CharUnicodeInfo.GetUnicodeCategory(c);
                if (category != UnicodeCategory.NonSpacingMark)
                    builder.Append(c == 'đ' ? 'd' : c);
            }

            var slug = builder.ToString().Normalize(NormalizationForm.FormC);
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug.Trim(), @"\s+", "-");
            slug = Regex.Replace(slug, "-{2,}", "-");
            return slug;
        }
    }
}
