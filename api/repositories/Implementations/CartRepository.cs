using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.data;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;
using Sprache;

namespace api.repositories.implementations
{
    public class CartRepository : Repository<Cart>, ICartRepository
    {
        public CartRepository(ApplicationDbContext context) : base(context) { }

        //__________________ Helper function ________________________  
        private IQueryable<Cart> BuildCartQuery(bool tracked = false)
        {
            IQueryable<Cart> query = _context.Set<Cart>()
                                            .Include(c => c.Items)
                                                .ThenInclude(i => i.Product)
                                            .Include(m => m.Items)
                                                .ThenInclude(e => e.ProductVariant);
            if (!tracked)
            {
                query = query.AsNoTracking();
            }
            return query;
        }
        private IQueryable<CartItem> BuildCartItemQuery(bool tracked = false)
        {
            IQueryable<CartItem> query = _context.Set<CartItem>()
                                                .Include(e => e.Product)
                                        .Include(i => i.ProductVariant);
            if (!tracked)
            {
                query = query.AsNoTracking();
            }
            return query;

        }

        public async Task<Cart?> GetByUserIdWithItemsAsync(string userId, CancellationToken ct = default)
        {
            return await BuildCartQuery(tracked: false)
                .FirstOrDefaultAsync(c => c.UserId == userId, ct);
        }

        public async Task<Cart?> GetByIdWithItemsAsync(string cartId, CancellationToken ct = default)
        {
            return await BuildCartQuery(tracked: false).FirstOrDefaultAsync(e => e.Id == cartId, ct);
        }
        public async Task<Cart?> GetTrackedByUserIdWithItemsAsync(string userId, CancellationToken ct = default)
        {
            return await BuildCartQuery(tracked: true).FirstOrDefaultAsync(e => e.UserId == userId, ct);
        }
        public async Task<Cart?> GetTrackedByIdWithItemsAsync(string cartId, CancellationToken ct = default)
        {
            return await BuildCartQuery(tracked: true).FirstOrDefaultAsync(e => e.Id == cartId, ct);
        }


        public async Task<CartItem?> GetCartItemByIdAsync(string cartItemId, CancellationToken ct = default)
        {
            return await BuildCartItemQuery(tracked: false).FirstOrDefaultAsync(e => e.Id == cartItemId, ct);
        }
        public async Task<CartItem?> GetCartItemByVariantAsync(string cartId, string productVariantId, CancellationToken ct = default)
        {
            return await BuildCartItemQuery(tracked: false).FirstOrDefaultAsync(e => e.CartId == cartId && e.ProductVariantId == productVariantId, ct);
        }
        public async Task<CartItem?> GetTrackedCartItemByIdAsync(string cartItemId, CancellationToken ct = default)
        {
            return await BuildCartItemQuery(tracked: true).FirstOrDefaultAsync(e => e.Id == cartItemId, ct);
        }
        public async Task<CartItem?> GetTrackedCartItemByVariantAsync(string cartId, string productVariantId, CancellationToken ct = default)
        {
            return await BuildCartItemQuery(tracked: true).FirstOrDefaultAsync(e => e.CartId == cartId && e.ProductVariantId == productVariantId, ct);
        }
        public async Task<List<CartItem>> GetItemsByCartIdAsync(string cartId, CancellationToken ct = default)
        {
            return await BuildCartItemQuery(tracked: false).Where(i => i.CartId == cartId).ToListAsync(ct);
        }
        public async Task<List<CartItem>> GetTrackedItemsByCartIdAsync(string cartId, CancellationToken ct = default)
        {
            return await _context.Set<CartItem>()
                .Where(i => i.CartId == cartId)
                .ToListAsync(ct);
        }
        public void AddCartItem(CartItem item)
        {
            _context.Set<CartItem>().Add(item);
        }

        public void RemoveCartItem(CartItem item)
        {
            _context.Set<CartItem>().Remove(item);
        }

        public void RemoveCartItems(IEnumerable<CartItem> items)
        {
            _context.Set<CartItem>().RemoveRange(items);
        }
    }
}