using System.Text.Json;
using api.common;
using api.middleware;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

namespace api.Tests.Middleware;

public sealed class GlobalExceptionHandlerTests
{
    [Fact]
    public async Task TryHandleAsync_HidesInternalExceptionMessageForServerErrors()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var context = CreateHttpContext("/api/orders");

        await handler.TryHandleAsync(
            context,
            new Exception("database password leaked"),
            CancellationToken.None);

        var body = await ReadResponseBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body)!;

        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Equal(ClientErrorMessages.ServerErrorTitle, problem.Title);
        Assert.Null(problem.Detail);
        Assert.DoesNotContain("database password leaked", body);
    }

    [Fact]
    public async Task TryHandleAsync_MapsAuthenticationExceptionToUnauthorizedProblem()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var context = CreateHttpContext("/api/cart/me");

        await handler.TryHandleAsync(
            context,
            new ApiAuthenticationException("token expired"),
            CancellationToken.None);

        var body = await ReadResponseBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body)!;

        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
        Assert.Equal(ClientErrorMessages.UnauthorizedTitle, problem.Title);
        Assert.Equal(ClientErrorMessages.UnauthorizedDetail, problem.Detail);
        Assert.DoesNotContain("token expired", body);
    }

    [Fact]
    public async Task TryHandleAsync_SanitizesValidationMessages()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var context = CreateHttpContext("/api/product");
        var exception = new ValidationException(new[]
        {
            new ValidationFailure("Sku", "raw sku failure")
        });

        await handler.TryHandleAsync(context, exception, CancellationToken.None);

        var body = await ReadResponseBodyAsync(context);
        using var document = JsonDocument.Parse(body);
        var errors = document.RootElement.GetProperty("errors");
        var skuErrors = errors.GetProperty("Sku").EnumerateArray().Select(value => value.GetString()).ToArray();

        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
        Assert.Contains(ClientErrorMessages.FieldInvalid, skuErrors);
        Assert.DoesNotContain("raw sku failure", body);
    }

    private static DefaultHttpContext CreateHttpContext(string path)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<string> ReadResponseBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        return await new StreamReader(context.Response.Body).ReadToEndAsync();
    }
}
