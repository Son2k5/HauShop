using api.DTOs.cart;

namespace api.services.interfaces.cart;

public interface ICartCacheService
{
    Task<CartDto?> GetUserCartAsync(string userId, CancellationToken ct = default);

    Task SetUserCartAsync(string userId, CartDto cart, CancellationToken ct = default);

    Task RemoveUserCartAsync(string userId, CancellationToken ct = default);
}
