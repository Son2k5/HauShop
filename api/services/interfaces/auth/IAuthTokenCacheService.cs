namespace api.services.interfaces.auth;

public interface IAuthTokenCacheService
{
    Task StoreRefreshTokenAsync(
        string tokenHash,
        string userId,
        TimeSpan ttl,
        CancellationToken ct = default);

    Task<string?> GetRefreshTokenUserIdAsync(string tokenHash, CancellationToken ct = default);

    Task RemoveRefreshTokenAsync(string tokenHash, CancellationToken ct = default);

    Task RemoveAllUserRefreshTokensAsync(string userId, CancellationToken ct = default);

    Task StorePasswordResetOtpAsync(
        string userId,
        string otpHash,
        TimeSpan ttl,
        CancellationToken ct = default);

    Task<string?> GetPasswordResetOtpHashAsync(string userId, CancellationToken ct = default);

    Task RemovePasswordResetOtpAsync(string userId, CancellationToken ct = default);
}
