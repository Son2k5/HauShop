using api.exceptions;
using FluentValidation;

namespace api.common;

public static class ClientErrorMessages
{
    public const string InvalidRequestTitle = "Yeu cau khong hop le";
    public const string InvalidRequestDetail = "Mot vai thong tin chua dung hoac con thieu. Vui long kiem tra lai.";
    public const string FieldInvalid = "Thong tin nay thieu hoac khong hop le.";

    public const string UnauthorizedTitle = "Can dang nhap";
    public const string UnauthorizedDetail = "Vui long dang nhap de tiep tuc.";

    public const string ForbiddenTitle = "Khong co quyen truy cap";
    public const string ForbiddenDetail = "Ban khong co quyen thuc hien thao tac nay.";

    public const string NotFoundTitle = "Khong tim thay";
    public const string NotFoundDetail = "Khong tim thay thong tin phu hop.";

    public const string CannotProcessTitle = "Khong the xu ly yeu cau";
    public const string CannotProcessDetail = "Yeu cau hien chua the thuc hien. Vui long kiem tra lai hoac thu sau.";

    public const string RequestCancelledTitle = "Yeu cau da bi huy";
    public const string ServerErrorTitle = "Co loi xay ra";
    public const string ServerErrorDetail = "Vui long thu lai sau.";

    public const string HubValidationDetail = "Du lieu gui len chua hop le. Vui long kiem tra lai.";
    public const string HubCannotProcessDetail = "Khong the thuc hien thao tac luc nay. Vui long thu lai.";

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
