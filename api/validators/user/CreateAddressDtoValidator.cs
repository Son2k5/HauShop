using api.DTOs.user;
using FluentValidation;

namespace api.validators.user;

public sealed class CreateAddressDtoValidator : AbstractValidator<CreateAddressDto>
{
    public CreateAddressDtoValidator()
    {
        RuleFor(x => x.AddressLine)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.City)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.State)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.State));

        RuleFor(x => x.Country)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Country));

        RuleFor(x => x.ZipCode)
            .MaximumLength(20)
            .When(x => !string.IsNullOrWhiteSpace(x.ZipCode));
    }
}
