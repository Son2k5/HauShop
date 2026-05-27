using api.DTOs.chat;
using api.models.enums;
using FluentValidation;

namespace api.validators.chat;

public sealed class SendChatMessageDtoValidator : AbstractValidator<SendChatMessageDto>
{
    public SendChatMessageDtoValidator()
    {
        RuleFor(x => x.ChatRoomId)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Message)
            .NotEmpty()
            .MaximumLength(5000);

        RuleFor(x => x.MessageType)
            .Must(value => Enum.TryParse<ChatMessageType>(value, true, out _))
            .WithMessage("Message type is invalid.");
    }
}
