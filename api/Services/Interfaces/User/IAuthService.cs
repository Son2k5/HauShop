
using api.DTOs.User;
namespace YourProject.Services.Interfaces
{
    public interface IAuthService
    {

        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);


        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);


        Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request);


        Task ChangePasswordAsync(ChangePasswordDto changePasswordDto, string userId);


        Task ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto);


        Task ResetPasswordAsync(ResetPasswordDto resetPasswordDto);


        Task LogoutAsync(string userId);


        Task RevokeRefreshTokenAsync(string refreshToken);
    }
}