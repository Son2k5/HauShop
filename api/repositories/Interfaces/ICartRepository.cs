using api.models.entities;

namespace api.repositories.interfaces
{
    public interface ICartRepository : IRepository<Cart>
    {
        // Cart - Read only
        Task<Cart?> GetByUserIdWithItemsAsync(string userId, CancellationToken ct = default);
        Task<Cart?> GetByIdWithItemsAsync(string cartId, CancellationToken ct = default);

        // Cart - Tracked
        Task<Cart?> GetTrackedByUserIdWithItemsAsync(string userId, CancellationToken ct = default);
        Task<Cart?> GetTrackedByIdWithItemsAsync(string cartId, CancellationToken ct = default);

        // CartItem - Read only
        Task<CartItem?> GetCartItemByIdAsync(string cartItemId, CancellationToken ct = default);
        Task<CartItem?> GetCartItemByVariantAsync(string cartId, string productVariantId, CancellationToken ct = default);

        // CartItem - Tracked
        Task<CartItem?> GetTrackedCartItemByIdAsync(string cartItemId, CancellationToken ct = default);
        Task<CartItem?> GetTrackedCartItemByVariantAsync(string cartId, string productVariantId, CancellationToken ct = default);

        // Bulk queries
        Task<List<CartItem>> GetItemsByCartIdAsync(string cartId, CancellationToken ct = default);
        Task<List<CartItem>> GetTrackedItemsByCartIdAsync(string cartId, CancellationToken ct = default);

        // Write operations
        void AddCartItem(CartItem item);
        void RemoveCartItem(CartItem item);
        void RemoveCartItems(IEnumerable<CartItem> items);
    }
}