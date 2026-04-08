using api.data;
using api.models.entities;
using api.repositories.interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.repositories.implementations
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
            if (string.IsNullOrWhiteSpace(userId))
                return new List<RefreshToken>();

            return await _context.RefreshTokens
                .Where(r => r.UserId == userId
                         && !r.IsRevoked               // thay cho !IsRevoked
                         && r.Expires > DateTime.UtcNow)  // thay cho !IsExpired
                .OrderByDescending(r => r.Created)              // nếu cần sắp xếp
                .ToListAsync();
        }

        public async Task RevokeAllUserTokensAsync(string userId)
        {
            var tokens = await _dbSet
            .Where(rt => rt.UserId == userId && !rt.IsRevoked && rt.Expires > DateTime.UtcNow)
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
