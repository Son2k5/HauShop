using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.entities;
using api.repositories.implementations;

namespace api.repositories.interfaces
{
    public interface IOrderRepository : IRepository<Order>
    {
        Task<Order?> GetByIdWithItemsAsync(string id, CancellationToken ct);
        Task<List<Order>> GetByUserIdAsync(string userId, CancellationToken ct);
    }
}