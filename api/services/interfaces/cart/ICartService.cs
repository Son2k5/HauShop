using api.DTOs.cart;

namespace api.services.interfaces.cart
{
    public interface ICartService
    {
        Task<CartDto> GetMyCartAsync(string userId, CancellationToken ct = default);
        Task<CartDto> AddItemAsync(string userId, AddCartItemDto dto, CancellationToken ct = default);
        Task<CartDto> IncreaseItemQuantityAsync(string userId, string cartItemId, int quantity = 1, CancellationToken ct = default);
        Task<CartDto> UpdateItemQuantityAsync(string userId, string cartItemId, UpdateCartItemDto dto, CancellationToken ct = default);
        Task<CartDto> RemoveItemAsync(string userId, string cartItemId, CancellationToken ct = default);
        Task<CartDto> ClearCartAsync(string userId, CancellationToken ct = default);
        Task<CartDto> MergeGuestCartAsync(string userId, MergeGuestCartDto dto, CancellationToken ct = default);
    }
}
