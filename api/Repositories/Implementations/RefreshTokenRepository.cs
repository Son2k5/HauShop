using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Entities;
using api.Repositories.Interfaces;

namespace api.Repositories.Implementations
{
    public class RefreshTokenRepository : Repository<RefreshToken>, IRefreshTokenRepository
    {
        public async Task AddAsync(RefreshToken refreshToken)
        {
            await _dbSet.AddAsync(refreshToken);
        }
    }
}