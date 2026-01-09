
using api.DTOs.User;
using api.Models.Entities;

namespace api.Mappings
{
    public class UserMapper
    {
        public static UserDto MapToUserDto(User user)
        {
            if (user == null) return null;
            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Avatar = user.Avatar,
                Role = user.Role.ToString(),
                MerchantId = user.MerchantId,
                Created = user.Created
            };
        }
    }
}