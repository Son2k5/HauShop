using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.entities;

namespace api.repositories.interfaces
{
    public interface IRefreshTokenRepository : IRepository<RefreshToken>
    {
        Task<RefreshToken?> GetByTokenAsync(string token);

        Task<IEnumerable<RefreshToken>> GetActiveTokensByUserIdAsync(string userId);

        Task<IEnumerable<RefreshToken>> GetExpiredTokensAsync();

        Task RevokeAllUserTokensAsync(string userId);
        public Task CleanupExpiredTokensAsync();
    }
}
