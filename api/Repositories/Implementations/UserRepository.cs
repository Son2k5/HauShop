using api.Data;
using api.Models.Entities;
using api.Repositories.Implementations;
using api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context)
        : base(context)
    {
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == email);
    }
}
