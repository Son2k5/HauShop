
using api.DTOs.User;

namespace api.Services.Interfaces.Auth
{
    public interface IGoogleAuthService
    {
        string BuildAuthorizationUrl(string state);

        Task<AuthResponseDto> HandleCallbackAsync(string code, string state, string expectedState);
    }
}