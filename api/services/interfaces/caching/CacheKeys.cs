using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using api.DTOs.product;

namespace api.services.interfaces.caching;

public static class CacheKeys
{
    public const string AppPrefix = "haushop:v1";

    public static string ProductPrefix => $"{AppPrefix}:product:";
    public static string ProductListPrefix => $"{AppPrefix}:product:list:";
    public static string ProductSlugPrefix => $"{AppPrefix}:product:slug:";
    public static string CategoryPrefix => $"{AppPrefix}:category:";
    public static string HomepagePrefix => $"{AppPrefix}:homepage:";
    public static string CartUserPrefix => $"{AppPrefix}:cart:user:";
    public static string JwtBlacklistPrefix => $"{AppPrefix}:auth:jwt:blacklist:";
    public static string RefreshTokenPrefix => $"{AppPrefix}:auth:refresh-token:";
    public static string RefreshTokenUserPrefix => $"{AppPrefix}:auth:refresh-token:user:";
    public static string OtpPrefix => $"{AppPrefix}:auth:otp:";
    public static string RateLimitLoginPrefix => $"{AppPrefix}:rate-limit:login:";

    public static string ProductDetail(string productId) => $"{ProductPrefix}{Normalize(productId)}";
    public static string ProductSlug(string slug) => $"{ProductSlugPrefix}{Normalize(slug)}";
    public static string ProductList(ProductQueryDto query) => $"{ProductListPrefix}{HashValue(NormalizeProductQuery(query))}";

    public static string CategoryAll() => $"{CategoryPrefix}all";
    public static string CategoryActive() => $"{CategoryPrefix}active";

    public static string Homepage(string section) => $"{HomepagePrefix}{Normalize(section)}";

    public static string UserCart(string userId) => $"{CartUserPrefix}{Normalize(userId)}";
    public static string GuestCart(string guestId) => $"{AppPrefix}:cart:guest:{Normalize(guestId)}";

    public static string JwtBlacklist(string jti) => $"{JwtBlacklistPrefix}{Normalize(jti)}";
    public static string RefreshToken(string refreshTokenHash) => $"{RefreshTokenPrefix}{HashValue(refreshTokenHash)}";
    public static string RefreshTokensByUser(string userId) => $"{RefreshTokenUserPrefix}{Normalize(userId)}";
    public static string PasswordResetOtp(string userId) => $"{OtpPrefix}reset-password:{Normalize(userId)}";

    public static string LoginRateLimit(string discriminator) => $"{RateLimitLoginPrefix}{HashValue(discriminator)}";
    public static string CacheIndex(string prefix) => $"{AppPrefix}:cache-index:{HashValue(prefix)}";

    public static string GetIndexPrefix(string key)
    {
        if (key.StartsWith(ProductListPrefix, StringComparison.Ordinal))
            return ProductListPrefix;

        if (key.StartsWith(ProductSlugPrefix, StringComparison.Ordinal))
            return ProductSlugPrefix;

        if (key.StartsWith(CartUserPrefix, StringComparison.Ordinal))
            return CartUserPrefix;

        var lastColon = key.LastIndexOf(':');
        return lastColon <= 0 ? key : key[..(lastColon + 1)];
    }

    public static string HashValue(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string NormalizeProductQuery(ProductQueryDto q)
    {
        var page = Math.Max(q.Page, 1);
        var pageSize = Math.Clamp(q.PageSize, 1, 100);

        return string.Join('|',
            Normalize(q.Search),
            Normalize(q.BrandId),
            Normalize(q.CategoryId),
            q.MinPrice?.ToString("0.##", CultureInfo.InvariantCulture) ?? "",
            q.MaxPrice?.ToString("0.##", CultureInfo.InvariantCulture) ?? "",
            q.IsActive?.ToString().ToLowerInvariant() ?? "",
            Normalize(q.SortBy),
            Normalize(q.SortOrder),
            page.ToString(),
            pageSize.ToString(),
            q.IncludeTotal.ToString().ToLowerInvariant());
    }

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? ""
            : value.Trim().ToLowerInvariant();
}
