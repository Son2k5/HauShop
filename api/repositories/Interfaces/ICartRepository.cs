using api.models.entities;

namespace api.repositories.interfaces
{
    public interface ICartRepository : IRepository<Cart>
    {
        Task<Cart?> GetByUserIdWithItemsAsync(string userId, CancellationToken ct = default);
        Task<Cart?> GetByIdWithItemsAsync(string cartId, CancellationToken ct = default);

        Task<CartItem?> GetCartItemByIdAsync(string cartItemId, CancellationToken ct = default);
        Task<CartItem?> GetCartItemByVariantAsync(string cartId, string productVariantId, CancellationToken ct = default);

        Task<ProductVariant?> GetActiveVariantAsync(string productVariantId, CancellationToken ct = default);

        Task<List<CartItem>> GetItemsByCartIdAsync(string cartId, CancellationToken ct = default);

        void AddCartItem(CartItem item);
        void RemoveCartItem(CartItem item);
        void RemoveCartItems(IEnumerable<CartItem> items);

        Task<int> SaveChangesAsync(CancellationToken ct = default);
    }
}