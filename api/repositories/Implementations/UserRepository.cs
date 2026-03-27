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

    public async Task<User?> GetByPhoneAsync(string phoneNumber)
    {
        return await _dbSet.Include(e => e.RefreshTokens)
                    .FirstOrDefaultAsync(e => e.PhoneNumber == phoneNumber);
    }

    public async Task<User?> GetByGoogleIdAsync(string googleId)
    {
        return await _dbSet.Include(e => e.RefreshTokens)
                            .FirstOrDefaultAsync(e => e.GoogleId == googleId);
    }
    public async Task<User?> GetByFacebookIdAsync(string facebookId)
    {
        return await _dbSet.Include(e => e.RefreshTokens)
                            .FirstOrDefaultAsync(e => e.FacebookId == facebookId);
    }


    // EXISTENCE CHECK


    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _dbSet.AnyAsync(e => e.Email == email);
    }
    public async Task<bool> PhoneExistsAsync(string phoneNumber)
    {
        return await _dbSet.AnyAsync(e => e.PhoneNumber == phoneNumber);
    }
}
