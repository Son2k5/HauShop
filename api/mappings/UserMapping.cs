
using api.DTOs.user;
using api.models.entities;

namespace api.mappings
{
    public static class UserMapping
    {
        public static UserDto MapToDto(User user)
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

    public static class UserMapper
    {
        public static UserDto MapToUserDto(User user)
        {
            return UserMapping.MapToDto(user);
        }
    }
}
