using api.DTOs.review;
using FluentValidation;

namespace api.validators.review;

public sealed class CreateReviewDtoValidator : AbstractValidator<CreateReviewDto>
{
    public CreateReviewDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5);

        RuleFor(x => x.Content)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.Content));
    }
}
