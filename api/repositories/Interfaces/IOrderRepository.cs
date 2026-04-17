using api.models.entities;

namespace api.repositories.interfaces
{
    public interface IOrderRepository : IRepository<Order>
    {
        Task<Order?> GetByIdWithIncludesAsync(string id, CancellationToken ct = default);
        Task<Order?> GetTrackedByIdWithIncludesAsync(string id, CancellationToken ct = default);
        Task<List<Order>> GetByUserIdAsync(string userId, CancellationToken ct = default);
        Task<Order?> GetTrackedByTransactionNoAsync(string transactionNo, CancellationToken ct = default);
        Task<int> SaveChangesAsync(CancellationToken ct = default);
    }
}