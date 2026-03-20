using FluentValidation;
using api.DTOs.User;
using api.Repositories.Interfaces;

namespace api.Validators
{
    public class RegisterDtoValidator : AbstractValidator<RegisterDto>
    {
        private readonly IUserRepository _userRepository;

        public RegisterDtoValidator(IUserRepository userRepository)
        {
            _userRepository = userRepository;
            ClassLevelCascadeMode = CascadeMode.Continue;

            // Kiểm tra Email
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(200).WithMessage("Email must not exceed 200 characters")
                .MustAsync(BeUniqueEmail).WithMessage("Email is already in use"); // Kiểm tra trùng ở DB

            // Kiểm tra Password
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .MaximumLength(100).WithMessage("Password must not exceed 100 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches(@"[0-9]").WithMessage("Password must contain at least one number")
                .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character");

            // Kiểm tra Họ và Tên
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required")
                .MaximumLength(100).WithMessage("First name must not exceed 100 characters")
                .Matches(@"^[a-zA-ZÀ-ỹ\s]+$").WithMessage("First name can only contain letters");

            RuleFor(x => x.LastName)
                .MaximumLength(100).WithMessage("Last name must not exceed 100 characters")
                .Matches(@"^[a-zA-ZÀ-ỹ\s]*$").WithMessage("Last name can only contain letters")
                .When(x => !string.IsNullOrEmpty(x.LastName));

            // Kiểm tra Số điện thoại Việt Nam
            RuleFor(x => x.PhoneNumber)
                .Matches(@"^(\+84|0)[3|5|7|8|9][0-9]{8}$").WithMessage("Invalid Vietnamese phone number")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
        }

        // Hàm xử lý kiểm tra trùng Email bất đồng bộ
        private async Task<bool> BeUniqueEmail(string email, CancellationToken cancellationToken)
        {
            var user = await _userRepository.GetByEmailAsync(email);
            return user == null; // Trả về true nếu chưa có ai sử dụng email này
        }
    }
}