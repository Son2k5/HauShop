using FluentValidation;
using FluentValidation.Results;

namespace api.common;

public static class ClientErrorMessages
{
    public const string InvalidRequestTitle = "Yêu cầu không hợp lệ";
    public const string InvalidRequestDetail = "Một vài thông tin chưa đúng hoặc còn thiếu. Vui lòng kiểm tra lại.";
    public const string FieldInvalid = "Thông tin này thiếu hoặc không hợp lệ.";

    public const string UnauthorizedTitle = "Cần đăng nhập";
    public const string UnauthorizedDetail = "Vui lòng đăng nhập để tiếp tục.";

    public const string ForbiddenTitle = "Không có quyền truy cập";
    public const string ForbiddenDetail = "Bạn không có quyền thực hiện thao tác này.";

    public const string NotFoundTitle = "Không tìm thấy";
    public const string NotFoundDetail = "Không tìm thấy thông tin phù hợp.";

    public const string CannotProcessTitle = "Không thể xử lý yêu cầu";
    public const string CannotProcessDetail = "Yêu cầu hiện chưa thể thực hiện. Vui lòng kiểm tra lại hoặc thử sau.";

    public const string RequestCancelledTitle = "Yêu cầu đã bị hủy";
    public const string ServerErrorTitle = "Có lỗi xảy ra";
    public const string ServerErrorDetail = "Vui lòng thử lại sau.";

    public const string HubValidationDetail = "Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.";
    public const string HubCannotProcessDetail = "Không thể thực hiện thao tác lúc này. Vui lòng thử lại.";

    public static string ToHubMessage(Exception exception)
    {
        return exception switch
        {
            ApiAuthenticationException => UnauthorizedDetail,
            ForbiddenAccessException or UnauthorizedAccessException => ForbiddenDetail,
            KeyNotFoundException => NotFoundDetail,
            ArgumentException or ValidationException => HubValidationDetail,
            InvalidOperationException => HubCannotProcessDetail,
            OperationCanceledException => RequestCancelledTitle,
            _ => ServerErrorDetail
        };
    }
}

public sealed class ApiAuthenticationException : Exception
{
    public ApiAuthenticationException(string message) : base(message)
    {
    }
}

public sealed class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException(string message) : base(message)
    {
    }
}

public static class ValidationResultExtensions
{
    public static IDictionary<string, string[]> ToClientSafeDictionary(this ValidationResult result)
    {
        return result.Errors
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
}
