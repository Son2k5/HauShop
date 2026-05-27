using api.data;
using api.DTOs.product;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.repositories.implementations;

public sealed class CategoryRepository : Repository<Category>, ICategoryRepository
{
    public CategoryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public Task<List<CategoryDto>> GetAllCategoryDtosAsync(CancellationToken ct = default)
    {
        return _dbSet
            .AsNoTracking()
            .OrderBy(category => category.ParentId)
            .ThenBy(category => category.Name)
            .Select(category => new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                ParentId = category.ParentId,
                IsActive = category.IsActive,
            })
            .ToListAsync(ct);
    }

    public Task<List<CategorySummaryDto>> GetActiveCategorySummaryDtosAsync(CancellationToken ct = default)
    {
        return _dbSet
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.ParentId)
            .ThenBy(category => category.Name)
            .Select(category => new CategorySummaryDto
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
            })
            .ToListAsync(ct);
    }
}
