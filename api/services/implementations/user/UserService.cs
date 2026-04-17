using api.data;
using api.DTOs.user;
using api.repositories.interfaces;
using api.services.interfaces;
using api.services.interfaces.cloud;
using Microsoft.AspNetCore.Http;
using api.services.interfaces.user;
using System.Threading;

namespace api.services.implementations
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ApplicationDbContext _context;
        private readonly ICloudinaryService _cloudinaryService;

        public UserService(
            IUserRepository userRepository,
            ApplicationDbContext context,
            ICloudinaryService cloudinaryService
        )
        {
            _userRepository = userRepository;
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<UserDto> GetCurrentUserAsync(string userId)
        {
            var user = await _userRepository.GetByIdAsync(userId, CancellationToken.None);
            if (user == null)
                throw new Exception("User not found");

            return api.mappings.UserMapping.MapToDto(user);
        }

        public async Task<UserDto> UpdateAvatarAsync(string userId, IFormFile file)
        {
            var user = await _userRepository.GetByIdAsync(userId, CancellationToken.None);
            if (user == null)
                throw new Exception("User not found");

            // Validate file
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is required");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Invalid file format");

            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("File size must be less than 5MB");

            // Upload to Cloudinary
            var uploadResult = await _cloudinaryService.UploadAvatarAsync(file, userId);

            if (!uploadResult.Success)
                throw new Exception(uploadResult.Error);

            // Update DB
            user.Avatar = uploadResult.Url;
            user.Updated = DateTime.UtcNow;

            _userRepository.Update(user);
            await _context.SaveChangesAsync();

            return api.mappings.UserMapping.MapToDto(user);
        }

        public async Task<UserDto> RemoveAvatarAsync(string userId)
        {
            var user = await _userRepository.GetByIdAsync(userId, CancellationToken.None);
            if (user == null)
                throw new Exception("User not found");

            user.Avatar = null;
            user.Updated = DateTime.UtcNow;

            _userRepository.Update(user);
            await _context.SaveChangesAsync();

            return api.mappings.UserMapping.MapToDto(user);
        }


    }
}