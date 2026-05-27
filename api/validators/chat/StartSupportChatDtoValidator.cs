using api.DTOs.chat;
using FluentValidation;

namespace api.validators.chat;

public sealed class StartSupportChatDtoValidator : AbstractValidator<StartSupportChatDto>
{
    public StartSupportChatDtoValidator()
    {
        RuleFor(x => x.Subject)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Subject));
    }
}
