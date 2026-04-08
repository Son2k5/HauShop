using api.data;
using api.data.seed;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace api.services.implementations.seed
{
    public class SeedService
    {
        private readonly ApplicationDbContext _context;

        public SeedService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SeedResult> SeedAllAsync()
        {
            var result = new SeedResult();

            var strategy = _context.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    result.Categories = await SeedCategoriesAsync();
                    result.Brands = await SeedBrandsAsync();
                    result.Products = await SeedProductsAsync();
                    result.ProductCats = await SeedProductCategoriesAsync();
                    result.Variants = await SeedVariantsAsync();

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    result.Success = true;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    result.Success = false;
                    result.Error = ex.Message;
                }
            });

            return result;
        }

        public async Task<SeedResult> ClearAllAsync()
        {
            var result = new SeedResult();

            var strategy = _context.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Xoá theo thứ tự ngược để tránh lỗi FK constraint
                    _context.ProductVariants.RemoveRange(_context.ProductVariants);
                    _context.ProductCategories.RemoveRange(_context.ProductCategories);
                    _context.Products.RemoveRange(_context.Products);
                    _context.Brands.RemoveRange(_context.Brands);
                    _context.Categories.RemoveRange(_context.Categories);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    result.Success = true;
                    result.Message = "Đã xoá toàn bộ dữ liệu seed.";
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    result.Success = false;
                    result.Error = ex.Message;
                }
            });

            return result;
        }

        // Private helpers

        private async Task<int> SeedCategoriesAsync()
        {
            var existing = await _context.Categories.Select(c => c.Id).ToHashSetAsync();
            var toInsert = SeedDataStore.Categories.Where(c => !existing.Contains(c.Id)).ToList();
            await _context.Categories.AddRangeAsync(toInsert);
            return toInsert.Count;
        }

        private async Task<int> SeedBrandsAsync()
        {
            var existing = await _context.Brands.Select(b => b.Id).ToHashSetAsync();
            var toInsert = SeedDataStore.Brands.Where(b => !existing.Contains(b.Id)).ToList();
            await _context.Brands.AddRangeAsync(toInsert);
            return toInsert.Count;
        }

        private async Task<int> SeedProductsAsync()
        {
            var existing = await _context.Products.Select(p => p.Id).ToHashSetAsync();
            var toInsert = SeedDataStore.Products.Where(p => !existing.Contains(p.Id)).ToList();
            await _context.Products.AddRangeAsync(toInsert);
            return toInsert.Count;
        }

        private async Task<int> SeedProductCategoriesAsync()
        {
            var existing = await _context.ProductCategories
                .Select(pc => new { pc.ProductId, pc.CategoryId })
                .ToListAsync();
            var existingSet = existing.Select(x => $"{x.ProductId}_{x.CategoryId}").ToHashSet();

            var toInsert = SeedDataStore.ProductCategories
                .Where(pc => !existingSet.Contains($"{pc.ProductId}_{pc.CategoryId}"))
                .ToList();
            await _context.ProductCategories.AddRangeAsync(toInsert);
            return toInsert.Count;
        }

        private async Task<int> SeedVariantsAsync()
        {
            var existing = await _context.ProductVariants.Select(v => v.Id).ToHashSetAsync();
            var toInsert = SeedDataStore.ProductVariants.Where(v => !existing.Contains(v.Id)).ToList();
            await _context.ProductVariants.AddRangeAsync(toInsert);
            return toInsert.Count;
        }
    }

    public class SeedResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Error { get; set; } = string.Empty;
        public int Categories { get; set; }
        public int Brands { get; set; }
        public int Products { get; set; }
        public int ProductCats { get; set; }
        public int Variants { get; set; }
    }
}