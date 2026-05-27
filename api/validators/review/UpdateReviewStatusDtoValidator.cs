using api.DTOs.review;
using FluentValidation;

namespace api.validators.review;

public sealed class UpdateReviewStatusDtoValidator : AbstractValidator<UpdateReviewStatusDto>
{
    public UpdateReviewStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum();
    }
}
