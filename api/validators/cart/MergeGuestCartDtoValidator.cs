using api.DTOs.cart;
using FluentValidation;

namespace api.validators.cart;

public sealed class MergeGuestCartDtoValidator : AbstractValidator<MergeGuestCartDto>
{
    public MergeGuestCartDtoValidator()
    {
        RuleFor(x => x.Items)
            .NotNull()
            .Must(items => items.Count <= 100)
            .WithMessage("Guest cart cannot contain more than 100 items.");

        RuleForEach(x => x.Items)
            .SetValidator(new MergeGuestCartItemDtoValidator());
    }
}

public sealed class MergeGuestCartItemDtoValidator : AbstractValidator<MergeGuestCartItemDto>
{
    public MergeGuestCartItemDtoValidator()
    {
        RuleFor(x => x.ProductVariantId)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Quantity)
            .GreaterThan(0);
    }
}
