using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.user;

namespace api.services.interfaces.user
{
    public interface IUserService
    {
        Task<UserDto> GetCurrentUserAsync(string userId);
        Task<UserDto> UpdateAvatarAsync(string userId, IFormFile file);
        Task<UserDto> RemoveAvatarAsync(string userId);
    }
}