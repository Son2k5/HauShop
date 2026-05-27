using api.DTOs.cart;
using FluentValidation;

namespace api.validators.cart;

public sealed class UpdateCartItemDtoValidator : AbstractValidator<UpdateCartItemDto>
{
    public UpdateCartItemDtoValidator()
    {
        RuleFor(x => x.Quantity)
            .GreaterThan(0);
    }
}
