namespace api.services.interfaces.auth;

public interface IJwtBlacklistService
{
    Task BlacklistTokenAsync(string accessToken, CancellationToken ct = default);

    Task BlacklistJtiAsync(string jti, TimeSpan ttl, CancellationToken ct = default);

    Task<bool> IsBlacklistedAsync(string? jti, CancellationToken ct = default);
}
