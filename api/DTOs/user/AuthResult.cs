namespace api.DTOs.user;

public sealed record AuthResult<T>(
    bool Succeeded,
    T? Value,
    string Message,
    int StatusCode)
{
    public static AuthResult<T> Success(T value, string message = "") =>
        new(true, value, message, StatusCodes.Status200OK);

    public static AuthResult<T> Failure(string message, int statusCode) =>
        new(false, default, message, statusCode);
}

public sealed record AuthResult(
    bool Succeeded,
    string Message,
    int StatusCode)
{
    public static AuthResult Success(string message = "") =>
        new(true, message, StatusCodes.Status200OK);

    public static AuthResult Failure(string message, int statusCode) =>
        new(false, message, statusCode);
}
