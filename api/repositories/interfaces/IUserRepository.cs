using api.models.entities;

namespace api.repositories.interfaces
{
    public interface IUserRepository : IRepository<User>
    {

        // AUTH / LOGIN


        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByPhoneAsync(string phoneNumber);

        Task<User?> GetByGoogleIdAsync(string googleId);
        Task<User?> GetByFacebookIdAsync(string facebookId);


        // EXISTENCE CHECK


        Task<bool> EmailExistsAsync(string email);
        Task<bool> PhoneExistsAsync(string phoneNumber);


        // RESET PASSWORD


        // Task<User?> GetByResetPasswordTokenAsync(string token);


        // // INCLUDE RELATIONS


        // Task<User?> GetWithCartAsync(string userId);
        // Task<User?> GetWithOrdersAsync(string userId);
        // Task<User?> GetWithAddressesAsync(string userId);


        // // STATUS


        // Task UpdateLastSeenAsync(string userId);
        // Task SetOnlineStatusAsync(string userId, bool isOnline);
    }
}
