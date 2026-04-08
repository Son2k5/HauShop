
using api.DTOs.user;

namespace api.services.interfaces.auth
{
    public interface IGoogleAuthService
    {
        string BuildAuthorizationUrl(string state);

        Task<AuthResponseDto> HandleCallbackAsync(string code, string state, string expectedState);
    }
}