using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Services.Interfaces.Auth;

namespace api.Controllers
{
    public partial class AuthController
    {

        [HttpGet("google")]
        [AllowAnonymous]
        public IActionResult GoogleLogin()
        {

            var state = Guid.NewGuid().ToString("N");

            Response.Cookies.Append("oauth_state", state, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddMinutes(10),
                Path = "/"
            });

            var redirectUrl = _googleAuthService.BuildAuthorizationUrl(state);
            return Redirect(redirectUrl);
        }

        [HttpGet("google/callback")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleCallback(
            [FromQuery] string? code,
            [FromQuery] string? state,
            [FromQuery] string? error)
        {
            var frontendUrl = _config["Google:FrontendUrl"] ?? "http://localhost:3000";

            if (!string.IsNullOrEmpty(error))
                return Redirect($"{frontendUrl}/signin?error=google_denied");

            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
                return Redirect($"{frontendUrl}/signin?error=invalid_request");

            // Lấy state từ cookie để đối chiếu
            var expectedState = Request.Cookies["oauth_state"];
            Response.Cookies.Delete("oauth_state"); // Xóa ngay sau khi dùng

            try
            {
                // Gọi service xử lý login/register bằng Google code
                var result = await _googleAuthService.HandleCallbackAsync(code, state, expectedState ?? "");

                // Tận dụng các hàm có sẵn trong file AuthController.cs 
                SetAccessTokenCookie(result.AccessToken);
                SetRefreshTokenCookie(result.RefreshToken);

                // Đăng nhập thành công, điều hướng về trang chủ Frontend
                return Redirect($"{frontendUrl}/");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình Google Callback");
                return Redirect($"{frontendUrl}/signin?error=auth_failed");
            }
        }
    }
}