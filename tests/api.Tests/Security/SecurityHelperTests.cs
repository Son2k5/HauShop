using api.DTOs.user;
using api.helpers;
using Microsoft.AspNetCore.Http;

namespace api.Tests.Security;

public sealed class SecurityHelperTests
{
    [Fact]
    public void PasswordHasher_HashesPasswordAndVerifiesOnlyMatchingInput()
    {
        const string password = "P@ssw0rd-For-Test";

        var hash = PasswordHasher.Hash(password);

        Assert.NotEqual(password, hash);
        Assert.True(PasswordHasher.Verify(password, hash));
        Assert.False(PasswordHasher.Verify("wrong-password", hash));
    }

    [Fact]
    public void HashRefreshToken_IsStableAndDoesNotReturnRawToken()
    {
        const string token = "refresh-token-value";

        var first = HashRefreshToken.Hash(token);
        var second = HashRefreshToken.Hash(token);
        var other = HashRefreshToken.Hash("different-token");

        Assert.Equal(first, second);
        Assert.NotEqual(token, first);
        Assert.NotEqual(first, other);
    }

    [Fact]
    public void AuthResult_FailureCarriesStatusCodeAndMessage()
    {
        var result = AuthResult<UserDto>.Failure(
            "Invalid email or password",
            StatusCodes.Status401Unauthorized);

        Assert.False(result.Succeeded);
        Assert.Null(result.Value);
        Assert.Equal(StatusCodes.Status401Unauthorized, result.StatusCode);
        Assert.Equal("Invalid email or password", result.Message);
    }
}
