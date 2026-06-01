using api.DTOs.order;
using Microsoft.AspNetCore.Http;

namespace api.services.interfaces.order
{
    public interface IOrderService
    {
        Task<CheckoutResponseDto> CheckoutAsync(
            string userId,
            CreateOrderDto dto,
            HttpContext httpContext,
            CancellationToken ct = default);

        Task<PagedOrderDto> GetMyOrdersAsync(
            string userId,
            int page = 1,
            int pageSize = 10,
            CancellationToken ct = default);

        Task<OrderDto> GetMyOrderByIdAsync(string userId, string orderId, CancellationToken ct = default);

        Task<OrderDto> CancelMyOrderAsync(string userId, string orderId, CancellationToken ct = default);

        Task<OrderDto> CompleteMyOrderAsync(string userId, string orderId, CancellationToken ct = default);

        Task<OrderDto> HandleVnPayReturnAsync(IQueryCollection query, CancellationToken ct = default);

        Task<OrderDto> UpdateOrderStatusAsync(
            string orderId,
            UpdateOrderStatusDto dto,
            string? actorUserId = null,
            bool requireMerchantOwnership = false,
            CancellationToken ct = default);
    }
}
