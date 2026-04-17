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

        Task<List<OrderDto>> GetMyOrdersAsync(string userId, CancellationToken ct = default);

        Task<OrderDto> GetMyOrderByIdAsync(string userId, string orderId, CancellationToken ct = default);

        Task<OrderDto> CancelMyOrderAsync(string userId, string orderId, CancellationToken ct = default);

        Task<OrderDto> HandleVnPayReturnAsync(IQueryCollection query, CancellationToken ct = default);
    }
}