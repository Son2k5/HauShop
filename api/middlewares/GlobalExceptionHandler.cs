using api.common;
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
                    => (StatusCodes.Status404NotFound, ClientErrorMessages.NotFoundTitle, ClientErrorMessages.NotFoundDetail),

                ApiAuthenticationException
                    => (StatusCodes.Status401Unauthorized, ClientErrorMessages.UnauthorizedTitle, ClientErrorMessages.UnauthorizedDetail),

                ForbiddenAccessException
                    => (StatusCodes.Status403Forbidden, ClientErrorMessages.ForbiddenTitle, ClientErrorMessages.ForbiddenDetail),

                UnauthorizedAccessException
                    => (StatusCodes.Status403Forbidden, ClientErrorMessages.ForbiddenTitle, ClientErrorMessages.ForbiddenDetail),

                ArgumentException
                    => (StatusCodes.Status400BadRequest, ClientErrorMessages.InvalidRequestTitle, ClientErrorMessages.InvalidRequestDetail),

                ValidationException
                    => (StatusCodes.Status400BadRequest, ClientErrorMessages.InvalidRequestTitle, ClientErrorMessages.InvalidRequestDetail),

                InvalidOperationException
                    => (StatusCodes.Status400BadRequest, ClientErrorMessages.CannotProcessTitle, ClientErrorMessages.CannotProcessDetail),

                OperationCanceledException
                    => (499, ClientErrorMessages.RequestCancelledTitle, null),

                _ => (StatusCodes.Status500InternalServerError, ClientErrorMessages.ServerErrorTitle, ClientErrorMessages.ServerErrorDetail),
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

            if (exception is ValidationException validationException)
            {
                problem.Extensions["errors"] = validationException.Errors
                    .GroupBy(error => string.IsNullOrWhiteSpace(error.PropertyName) ? "request" : error.PropertyName)
                    .ToDictionary(
                        group => group.Key,
                        group => group
                            .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                                ? ClientErrorMessages.FieldInvalid
                                : error.ErrorMessage)
                            .Distinct()
                            .ToArray());
            }

            await context.Response.WriteAsJsonAsync(problem, ct);

            return true;
        }
    }
}
