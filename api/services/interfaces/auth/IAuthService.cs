
using api.DTOs.user;
namespace api.services.interfaces.auth
{
    public interface IAuthService
    {
        Task<AuthResult<AuthResponseDto>> RegisterAsync(RegisterDto dto);

        Task<AuthResult<AuthResponseDto>> LoginAsync(LoginDto dto);

        Task<AuthResult<AuthResponseDto>> RefreshTokenAsync(string refreshToken);

        Task<AuthResult> LogoutAsync(string userId, string refreshToken);

        Task<AuthResult> ChangePasswordAsync(ChangePasswordDto dto, string userId);

        Task<AuthResult> ForgotPasswordAsync(string email);

        Task<AuthResult> ResetPasswordAsync(ResetPasswordDto dto);
        Task<AuthResult> RevokeRefreshTokenAsync(string userId, string refreshToken);

        Task<AuthResult<UserDto>> GetCurrentUserAsync(string userId);
    }

}
