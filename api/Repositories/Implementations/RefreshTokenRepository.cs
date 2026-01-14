using api.Data;
using api.Models.Entities;
using api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.Repositories.Implementations
{
    public class RefreshTokenRepository
        : Repository<RefreshToken>, IRefreshTokenRepository
    {
        public RefreshTokenRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<RefreshToken?> GetByTokenAsync(string token)
        {
            return await _dbSet
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == token);
        }

        public async Task<IEnumerable<RefreshToken>> GetExpiredTokensAsync()
        {
            return await _dbSet
                .Where(rt => rt.Expires < DateTime.UtcNow || rt.IsRevoked)
                .ToListAsync();
        }

        public async Task<IEnumerable<RefreshToken>> GetActiveTokensByUserIdAsync(string userId)
        {
            return await _dbSet
                .Where(rt => rt.UserId == userId && rt.IsActive)
                .OrderByDescending(rt => rt.Created)
                .ToListAsync();
        }

        public async Task RevokeAllUserTokensAsync(string userId)
        {
            var tokens = await _dbSet
                .Where(rt => rt.UserId == userId && rt.IsActive)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
            }
        }
        public async Task CleanupExpiredTokensAsync()
        {
            var expiredTokens = await GetExpiredTokensAsync();
            _dbSet.RemoveRange(expiredTokens);
            await _context.SaveChangesAsync();
        }
    }
}
