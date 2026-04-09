using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace api.middleware
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext context,
            Exception exception,
            CancellationToken ct)
        {
            var (statusCode, message) = exception switch
            {
                KeyNotFoundException => (StatusCodes.Status404NotFound, exception.Message),
                InvalidOperationException => (StatusCodes.Status409Conflict, exception.Message),
                UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized"),
                ArgumentException => (StatusCodes.Status400BadRequest, exception.Message),
                OperationCanceledException => (StatusCodes.Status499ClientClosedRequest, "Request cancelled"),
                _ => (StatusCodes.Status500InternalServerError, "Internal server error"),
            };

            if (statusCode == 500)
                _logger.LogError(exception, "Unhandled exception: {Path}", context.Request.Path);
            else
                _logger.LogWarning(exception, "Handled exception [{Status}]: {Path}",
                    statusCode, context.Request.Path);

            context.Response.StatusCode = statusCode;

            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = statusCode,
                Title = message,
                Instance = context.Request.Path,
            }, ct);

            return true;
        }
    }
}