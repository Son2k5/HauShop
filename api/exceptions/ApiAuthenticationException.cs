namespace api.exceptions;

public sealed class ApiAuthenticationException : Exception
{
    public ApiAuthenticationException(string message) : base(message)
    {
    }
}
