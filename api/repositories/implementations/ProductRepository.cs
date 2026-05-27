using api.data;
using api.DTOs.product;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace api.repositories.implementations
{
    public class ProductRepository : Repository<Product>, IProductRepository
    {
        private static readonly SemaphoreSlim FullTextIndexLock = new(1, 1);
        private static bool? HasProductFullTextIndexCache;

        public ProductRepository(ApplicationDbContext context) : base(context) { }

        public async Task<List<ProductSummaryDto>> GetLatestActiveSummariesAsync(
            int pageSize,
            CancellationToken ct = default)
        {
            var take = Math.Clamp(pageSize, 1, 24);

            var items = await _dbSet
                .AsNoTracking()
                .Where(p => p.IsActive)
                .OrderByDescending(p => p.Created)
                .Take(take)
                .Select(p => new ProductSummaryDto
                {
                    Id = p.Id,
                    Sku = p.Sku,
                    Name = p.Name,
                    Slug = p.Slug,
                    ImageUrl = p.ImageUrl,
                    Price = p.Price,
                    IsActive = p.IsActive,
                    BrandId = p.BrandId,
                    BrandName = p.Brand != null ? p.Brand.Name : null,
                    MinVariantPrice = p.ProductVariants.Where(v => v.IsActive).Min(v => (decimal?)v.Price) ?? p.Price,
                    TotalStock = p.ProductVariants.Where(v => v.IsActive).Sum(v => v.Stock),
                    DefaultVariantId = p.ProductVariants
                        .Where(v => v.IsActive && v.Stock > 0)
                        .OrderBy(v => v.CreateAt)
                        .Select(v => v.Id)
                        .FirstOrDefault(),
                    Stock = p.Stock,
                    AverageRating = p.AverageRating,
                    ReviewCount = p.ReviewCount,
                    Categories = p.ProductCategories
                        .Where(pc => pc.Category != null)
                        .Select(pc => new CategorySummaryDto
                        {
                            Id = pc.CategoryId,
                            Name = pc.Category.Name,
                            Slug = pc.Category.Slug,
                        })
                        .ToList(),
                    Created = p.Created,
                })
                .ToListAsync(ct);

            return items;
        }

        public async Task<(List<ProductSummaryDto> Items, int Total, bool HasNextPage)> GetPagedAsync(
            ProductQueryDto q,
            CancellationToken ct = default)
        {
            var query = _dbSet.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(q.Search))
            {
                var raw = q.Search.Trim();
                var trimmed = raw.Length > 200 ? raw[..200] : raw;

                if (trimmed.Length <= 2)
                {
                    var pattern = $"{EscapeLike(trimmed)}%";

                    query = query.Where(p =>
                        EF.Functions.Like(p.Name, pattern, "\\") ||
                        EF.Functions.Like(p.Sku, pattern, "\\"));
                }
                else
                {
                    var fullTextQuery = BuildFullTextQuery(trimmed);

                    if (!string.IsNullOrWhiteSpace(fullTextQuery))
                    {
                        query = await HasProductFullTextIndexAsync(ct)
                            ? query.Where(p =>
                                EF.Functions.IsMatch(
                                    new[] { p.Name, p.Sku, p.Description },
                                    fullTextQuery,
                                    MySqlMatchSearchMode.Boolean))
                            : ApplyLikeSearch(query, trimmed);
                    }
                    else
                    {
                        query = query.Where(_ => false);
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(q.BrandId))
                query = query.Where(p => p.BrandId == q.BrandId);

            if (!string.IsNullOrWhiteSpace(q.CategoryId))
                query = query.Where(p =>
                    p.ProductCategories.Any(pc => pc.CategoryId == q.CategoryId));

            if (q.MinPrice.HasValue) query = query.Where(p => p.Price >= q.MinPrice.Value);
            if (q.MaxPrice.HasValue) query = query.Where(p => p.Price <= q.MaxPrice.Value);
            if (q.IsActive.HasValue) query = query.Where(p => p.IsActive == q.IsActive.Value);

            var total = q.IncludeTotal ? await query.CountAsync(ct) : 0;

            query = (q.SortBy?.ToLowerInvariant(), q.SortOrder?.ToLowerInvariant()) switch
            {
                ("price", "asc") => query.OrderBy(p => p.Price),
                ("price", "desc") => query.OrderByDescending(p => p.Price),
                ("name", "asc") => query.OrderBy(p => p.Name),
                ("name", "desc") => query.OrderByDescending(p => p.Name),
                ("created", "asc") => query.OrderBy(p => p.Created),
                _ => query.OrderByDescending(p => p.Created),
            };

            var page = Math.Max(q.Page, 1);
            var pageSize = Math.Clamp(q.PageSize, 1, 100);

            var take = q.IncludeTotal ? pageSize : pageSize + 1;
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(take)
                .Select(p => new ProductSummaryDto
                {
                    Id = p.Id,
                    Sku = p.Sku,
                    Name = p.Name,
                    Slug = p.Slug,
                    ImageUrl = p.ImageUrl,
                    Price = p.Price,
                    IsActive = p.IsActive,
                    BrandId = p.BrandId,
                    BrandName = p.Brand != null ? p.Brand.Name : null,
                    MinVariantPrice = p.ProductVariants.Where(v => v.IsActive).Min(v => (decimal?)v.Price) ?? p.Price,
                    TotalStock = p.ProductVariants.Where(v => v.IsActive).Sum(v => v.Stock),
                    DefaultVariantId = p.ProductVariants
                        .Where(v => v.IsActive && v.Stock > 0)
                        .OrderBy(v => v.CreateAt)
                        .Select(v => v.Id)
                        .FirstOrDefault(),
                    Stock = p.Stock,
                    AverageRating = p.AverageRating,
                    ReviewCount = p.ReviewCount,
                    Categories = p.ProductCategories
                        .Where(pc => pc.Category != null)
                        .Select(pc => new CategorySummaryDto
                        {
                            Id = pc.CategoryId,
                            Name = pc.Category.Name,
                            Slug = pc.Category.Slug,
                        })
                        .ToList(),
                    Created = p.Created,
                })
                .ToListAsync(ct);

            var hasNextPage = !q.IncludeTotal && items.Count > pageSize;
            if (hasNextPage)
            {
                items.RemoveAt(items.Count - 1);
            }

            return (items, total, hasNextPage);
        }

        private static string EscapeLike(string value) =>
            value
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");

        private static IQueryable<Product> ApplyLikeSearch(IQueryable<Product> query, string value)
        {
            var escaped = EscapeLike(value);
            var prefixPattern = $"{escaped}%";
            var descriptionPrefixPattern = $"{escaped}%";

            return query.Where(p =>
                EF.Functions.Like(p.Name, prefixPattern, "\\") ||
                EF.Functions.Like(p.Sku, prefixPattern, "\\") ||
                EF.Functions.Like(p.Description, descriptionPrefixPattern, "\\"));
        }

        private async Task<bool> HasProductFullTextIndexAsync(CancellationToken ct)
        {
            if (HasProductFullTextIndexCache.HasValue)
                return HasProductFullTextIndexCache.Value;

            await FullTextIndexLock.WaitAsync(ct);
            try
            {
                if (HasProductFullTextIndexCache.HasValue)
                    return HasProductFullTextIndexCache.Value;

                var connection = _context.Database.GetDbConnection();
                var shouldClose = connection.State == ConnectionState.Closed;

                if (shouldClose)
                {
                    await connection.OpenAsync(ct);
                }

                try
                {
                    await using var command = connection.CreateCommand();
                    command.CommandText = """
                        SELECT 1
                        FROM information_schema.STATISTICS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'Products'
                          AND INDEX_TYPE = 'FULLTEXT'
                        GROUP BY INDEX_NAME
                        HAVING COUNT(*) = 3
                           AND SUM(CASE WHEN COLUMN_NAME = 'Name' AND SEQ_IN_INDEX = 1 THEN 1 ELSE 0 END) = 1
                           AND SUM(CASE WHEN COLUMN_NAME = 'Sku' AND SEQ_IN_INDEX = 2 THEN 1 ELSE 0 END) = 1
                           AND SUM(CASE WHEN COLUMN_NAME = 'Description' AND SEQ_IN_INDEX = 3 THEN 1 ELSE 0 END) = 1
                        LIMIT 1;
                        """;

                    var result = await command.ExecuteScalarAsync(ct);
                    HasProductFullTextIndexCache = result != null && result != DBNull.Value;
                    return HasProductFullTextIndexCache.Value;
                }
                finally
                {
                    if (shouldClose)
                    {
                        await connection.CloseAsync();
                    }
                }
            }
            finally
            {
                FullTextIndexLock.Release();
            }
        }

        private static string BuildFullTextQuery(string value)
        {
            var terms = value
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(term => new string(term.Where(char.IsLetterOrDigit).ToArray()))
                .Where(term => term.Length > 0)
                .Take(8)
                .Select(term => $"+{term}*");

            return string.Join(' ', terms);
        }

        public async Task<Product?> GetByIdWithIncludesAsync(string id, CancellationToken ct = default) =>
            await _dbSet
                .AsNoTracking()
                .AsSplitQuery()
                .Include(p => p.Brand)
                .Include(p => p.ProductCategories).ThenInclude(pc => pc.Category)
                .Include(p => p.ProductVariants.Where(v => v.IsActive))
                .FirstOrDefaultAsync(p => p.Id == id, ct);

        public async Task<Product?> GetBySlugAsync(string slug, CancellationToken ct = default) =>
            await _dbSet
                .AsNoTracking()
                .AsSplitQuery()
                .Include(p => p.Brand)
                .Include(p => p.ProductCategories).ThenInclude(pc => pc.Category)
                .Include(p => p.ProductVariants.Where(v => v.IsActive))
                .FirstOrDefaultAsync(p => p.Slug == slug, ct);

        public async Task<bool> ExistsSkuAsync(string sku, string? excludeId = null, CancellationToken ct = default) =>
            excludeId == null
                ? await AnyAsync(p => p.Sku == sku, ct)
                : await AnyAsync(p => p.Sku == sku && p.Id != excludeId, ct);

        public async Task<bool> ExistsSlugAsync(string slug, string? excludeId = null, CancellationToken ct = default) =>
            excludeId == null
                ? await AnyAsync(p => p.Slug == slug, ct)
                : await AnyAsync(p => p.Slug == slug && p.Id != excludeId, ct);

        public async Task SyncCategoriesAsync(
            string productId,
            List<string> categoryIds,
            CancellationToken ct = default)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            try
            {
                var existingIds = await _context.ProductCategories
                    .Where(pc => pc.ProductId == productId)
                    .Select(pc => pc.CategoryId)
                    .ToListAsync(ct);

                var existingSet = existingIds.ToHashSet();
                var newSet = categoryIds.ToHashSet();

                var toRemove = existingSet
                    .Except(newSet)
                    .Select(cid => new ProductCategory { ProductId = productId, CategoryId = cid });

                var toAdd = newSet
                    .Except(existingSet)
                    .Select(cid => new ProductCategory { ProductId = productId, CategoryId = cid });

                _context.ProductCategories.RemoveRange(toRemove);
                await _context.ProductCategories.AddRangeAsync(toAdd, ct);

                await _context.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }

        public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            return await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateProductRatingAsync(string productId, CancellationToken ct = default)
        {
            var product = await _dbSet.FindAsync(new object[] { productId }, ct);
            if (product == null) return;

            var stats = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.ProductId == productId && r.Status == models.enums.ReviewStatus.Approved)
                .GroupBy(r => r.ProductId)
                .Select(g => new
                {
                    AverageRating = g.Average(r => r.Rating),
                    ReviewCount = g.Count()
                })
                .FirstOrDefaultAsync(ct);

            product.Updated = DateTime.UtcNow;
            product.AverageRating = stats == null ? 0 : Math.Round((decimal)stats.AverageRating, 1);
            product.ReviewCount = stats?.ReviewCount ?? 0;

            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateProductStockAsync(string productId, CancellationToken ct = default)
        {
            var product = await _dbSet.FindAsync(new object[] { productId }, ct);
            if (product == null) return;

            var totalStock = await _context.ProductVariants
                .Where(v => v.ProductId == productId && v.IsActive)
                .SumAsync(v => (int?)v.Stock, ct) ?? 0;

            product.Stock = totalStock;
            product.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
        }
    }
}
