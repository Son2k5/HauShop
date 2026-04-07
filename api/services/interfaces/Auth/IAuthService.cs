
using api.DTOs.User;
namespace api.Services.Interfaces.Auth
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);

        Task<AuthResponseDto> LoginAsync(LoginDto dto);

        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);

        Task LogoutAsync(string userId, string refreshToken);

        Task ChangePasswordAsync(ChangePasswordDto dto, string userId);

        Task ForgotPasswordAsync(string email);

        Task ResetPasswordAsync(ResetPasswordDto dto);
        Task RevokeRefreshTokenAsync(string userId, string refreshToken);

        Task<UserDto> GetCurrentUserAsync(string userId);
    }

}