using api.DTOs.order;
using api.models.entities;

namespace api.repositories.interfaces
{
    public interface IOrderRepository : IRepository<Order>
    {
        Task<Order?> GetByIdWithIncludesAsync(string id, CancellationToken ct = default);
        Task<Order?> GetTrackedByIdWithIncludesAsync(string id, CancellationToken ct = default);
        Task<(List<OrderSummaryDto> Items, int Total)> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default);
        Task<Order?> GetTrackedByTransactionNoAsync(string transactionNo, CancellationToken ct = default);
    }
}
