using api.DTOs.product;
using api.models.entities;

namespace api.repositories.interfaces;

public interface ICategoryRepository : IRepository<Category>
{
    Task<List<CategoryDto>> GetAllCategoryDtosAsync(CancellationToken ct = default);

    Task<List<CategorySummaryDto>> GetActiveCategorySummaryDtosAsync(CancellationToken ct = default);
}
