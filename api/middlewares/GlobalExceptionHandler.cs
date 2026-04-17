using FluentValidation;
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
            var traceId = context.TraceIdentifier;

            var (statusCode, title, detail) = exception switch
            {
                KeyNotFoundException
                    => (StatusCodes.Status404NotFound, exception.Message, null),

                UnauthorizedAccessException
                    => (StatusCodes.Status403Forbidden, "Forbidden", exception.Message),

                ArgumentException
                    => (StatusCodes.Status400BadRequest, exception.Message, null),

                ValidationException valEx
                    => (StatusCodes.Status400BadRequest, "Validation failed",
                        string.Join("; ", valEx.Errors.Select(e => e.ErrorMessage))),

                InvalidOperationException
                    => (StatusCodes.Status400BadRequest, exception.Message, null),

                OperationCanceledException
                    => (499, "Request cancelled", null),

                _ => (StatusCodes.Status500InternalServerError, "Internal server error", exception.Message),
            };

            if (statusCode >= 500)
            {
                _logger.LogError(exception,
                    "Unhandled exception [{TraceId}] at {Path}",
                    traceId, context.Request.Path);
            }
            else
            {
                _logger.LogWarning(exception,
                    "Handled exception [{Status}] [{TraceId}] at {Path}",
                    statusCode, traceId, context.Request.Path);
            }

            context.Response.StatusCode = statusCode;

            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Instance = context.Request.Path,
                Extensions =
                {
                    ["message"] = detail ?? title,
                    ["traceId"] = traceId
                }
            }, ct);

            return true;
        }
    }
}
