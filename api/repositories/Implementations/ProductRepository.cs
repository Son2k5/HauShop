using api.data;
using api.DTOs.product;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.repositories.implementations
{
    public class ProductRepository : Repository<Product>, IProductRepository
    {
        public ProductRepository(ApplicationDbContext context) : base(context) { }

        public async Task<(List<ProductSummaryDto> Items, int Total)> GetPagedAsync(
            ProductQueryDto q,
            CancellationToken ct = default)
        {
            var query = _dbSet.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(q.Search))
            {
                // Giới hạn độ dài tránh MySQL reject / timeout
                var raw = q.Search.Trim();
                var trimmed = raw.Length > 200 ? raw[..200] : raw;

                var escaped = trimmed
                    .Replace("\\", "\\\\")
                    .Replace("%", "\\%")
                    .Replace("_", "\\_");
                var pattern = $"%{escaped}%";

                query = query.Where(p =>
                    EF.Functions.Like(p.Name, pattern, "\\") ||
                    EF.Functions.Like(p.Sku, pattern, "\\") ||
                    (p.Description != null && EF.Functions.Like(p.Description, pattern, "\\")));
            }

            if (!string.IsNullOrWhiteSpace(q.BrandId))
                query = query.Where(p => p.BrandId == q.BrandId);

            if (!string.IsNullOrWhiteSpace(q.CategoryId))
                query = query.Where(p =>
                    p.ProductCategories.Any(pc => pc.CategoryId == q.CategoryId));

            if (q.MinPrice.HasValue) query = query.Where(p => p.Price >= q.MinPrice.Value);
            if (q.MaxPrice.HasValue) query = query.Where(p => p.Price <= q.MaxPrice.Value);
            if (q.IsActive.HasValue) query = query.Where(p => p.IsActive == q.IsActive.Value);

            var total = await query.CountAsync(ct);

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

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

                    // null-check tường minh — Category có thể bị xóa mà FK không cascade
                    Categories = p.ProductCategories
                        .Where(pc => pc.Category != null)
                        .Select(pc => new CategorySummaryDto
                        {
                            Id = pc.CategoryId,
                            Name = pc.Category.Name,
                            Slug = pc.Category.Slug,
                        })
                        .ToList(),

                    // Fallback về product.Price nếu không có variant active
                    MinVariantPrice = p.ProductVariants
                        .Where(v => v.IsActive)
                        .Select(v => (decimal?)v.Price)
                        .Min() ?? p.Price,

                    TotalStock = p.ProductVariants
                        .Where(v => v.IsActive)
                        .Sum(v => (int?)v.Stock) ?? 0,

                    // Tồn kho và Rating từ Product entity
                    Stock = p.Stock,
                    AverageRating = p.AverageRating,
                    ReviewCount = p.ReviewCount,

                    Created = p.Created,
                })
                .ToListAsync(ct);

            return (items, total);
        }

        // AsSplitQuery: tránh Cartesian product khi Include nhiều collection cùng lúc
        // VD: 1 product, 3 categories, 5 variants → JOIN thường = 15 dòng, SplitQuery = 9 dòng
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
                ? await AnyAsync(p => p.Sku == sku)
                : await AnyAsync(p => p.Sku == sku && p.Id != excludeId);

        public async Task<bool> ExistsSlugAsync(string slug, string? excludeId = null, CancellationToken ct = default) =>
            excludeId == null
                ? await AnyAsync(p => p.Slug == slug)
                : await AnyAsync(p => p.Slug == slug && p.Id != excludeId);

        public async Task SyncCategoriesAsync(
            string productId,
            List<string> categoryIds,
            CancellationToken ct = default)
        {
            // Transaction tường minh: nếu AddRange fail thì RemoveRange cũng rollback
            // Tránh trường hợp product bị mất toàn bộ category
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

        /// <summary>
        /// Tính toán và cập nhật AverageRating và ReviewCount cho product từ Reviews
        /// </summary>
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

            product.AverageRating = stats != null ? (decimal)stats.AverageRating : 0;
            product.ReviewCount = stats?.ReviewCount ?? 0;
            product.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
        }

        /// <summary>
        /// Tính toán và cập nhật tổng Stock từ ProductVariants
        /// </summary>
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