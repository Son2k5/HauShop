using api.exceptions;
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

                ApiAuthenticationException
                    => (StatusCodes.Status401Unauthorized, "Unauthorized", null),

                ForbiddenAccessException
                    => (StatusCodes.Status403Forbidden, "Forbidden", null),

                UnauthorizedAccessException
                    => (StatusCodes.Status403Forbidden, "Forbidden", null),

                ArgumentException
                    => (StatusCodes.Status400BadRequest, exception.Message, null),

                ValidationException valEx
                    => (StatusCodes.Status400BadRequest, "Validation failed",
                        string.Join("; ", valEx.Errors.Select(e => e.ErrorMessage))),

                InvalidOperationException
                    => (StatusCodes.Status400BadRequest, exception.Message, null),

                OperationCanceledException
                    => (499, "Request cancelled", null),

                _ => (StatusCodes.Status500InternalServerError, "Internal server error", null),
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

            var safeDetail = statusCode >= 500 ? null : detail;
            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = safeDetail,
                Instance = context.Request.Path,
                Extensions =
                {
                    ["traceId"] = traceId
                }
            };

            if (statusCode < 500)
            {
                problem.Extensions["message"] = safeDetail ?? title;
            }

            await context.Response.WriteAsJsonAsync(problem, ct);

            return true;
        }
    }
}
