using api.DTOs.product;

namespace api.services.interfaces.category;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(CancellationToken ct = default);

    Task<List<CategorySummaryDto>> GetActiveAsync(CancellationToken ct = default);
}
