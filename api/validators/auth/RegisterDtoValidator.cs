using api.DTOs.user;
using FluentValidation;

namespace api.validators
{
    public class RegisterDtoValidator : AbstractValidator<RegisterDto>
    {
        public RegisterDtoValidator()
        {
            ClassLevelCascadeMode = CascadeMode.Continue;

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Vui lòng nhập email")
                .EmailAddress().WithMessage("Email không đúng định dạng")
                .MaximumLength(200).WithMessage("Email không được vượt quá 200 ký tự");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Vui lòng nhập mật khẩu")
                .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự")
                .MaximumLength(100).WithMessage("Mật khẩu không được vượt quá 100 ký tự")
                .Matches(@"[A-Z]").WithMessage("Mật khẩu phải có ít nhất một chữ cái viết hoa")
                .Matches(@"[a-z]").WithMessage("Mật khẩu phải có ít nhất một chữ cái viết thường")
                .Matches(@"[0-9]").WithMessage("Mật khẩu phải có ít nhất một chữ số")
                .Matches(@"[^a-zA-Z0-9]").WithMessage("Mật khẩu phải có ít nhất một ký tự đặc biệt");

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("Vui lòng nhập tên")
                .MaximumLength(100).WithMessage("Tên không được vượt quá 100 ký tự")
                .Matches(@"^[a-zA-ZÀ-ỹ\s]+$").WithMessage("Tên chỉ được chứa chữ cái");

            RuleFor(x => x.LastName)
                .MaximumLength(100).WithMessage("Họ không được vượt quá 100 ký tự")
                .Matches(@"^[a-zA-ZÀ-ỹ\s]*$").WithMessage("Họ chỉ được chứa chữ cái")
                .When(x => !string.IsNullOrEmpty(x.LastName));

            RuleFor(x => x.PhoneNumber)
                .Matches(@"^(\+84|0)[35789][0-9]{8}$").WithMessage("Số điện thoại không hợp lệ")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
        }
    }
}
