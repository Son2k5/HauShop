using api.DTOs.order;
using FluentValidation;

namespace api.validators.order;

public sealed class CreateOrderDtoValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderDtoValidator()
    {
        RuleFor(x => x.ShippingAddressId)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.PaymentMethod)
            .IsInEnum();

        RuleFor(x => x.ShippingFee)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.Note)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Note));
    }
}
