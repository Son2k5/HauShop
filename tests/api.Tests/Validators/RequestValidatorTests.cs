using api.DTOs.cart;
using api.DTOs.chat;
using api.DTOs.order;
using api.DTOs.review;
using api.models.enums;
using api.validators.cart;
using api.validators.chat;
using api.validators.order;
using api.validators.review;

namespace api.Tests.Validators;

public sealed class RequestValidatorTests
{
    [Fact]
    public void CreateOrderDtoValidator_AcceptsValidCheckoutRequest()
    {
        var validator = new CreateOrderDtoValidator();
        var dto = new CreateOrderDto
        {
            ShippingAddressId = "addr-1",
            PaymentMethod = PaymentMethod.COD,
            ShippingFee = 25_000,
            Note = "Leave at reception"
        };

        var result = validator.Validate(dto);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateOrderDtoValidator_RejectsInvalidCheckoutRequest()
    {
        var validator = new CreateOrderDtoValidator();
        var dto = new CreateOrderDto
        {
            ShippingAddressId = "",
            PaymentMethod = (PaymentMethod)999,
            ShippingFee = -1,
            Note = new string('x', 501)
        };

        var result = validator.Validate(dto);
        var invalidProperties = result.Errors.Select(error => error.PropertyName).ToHashSet();

        Assert.False(result.IsValid);
        Assert.Contains(nameof(CreateOrderDto.ShippingAddressId), invalidProperties);
        Assert.Contains(nameof(CreateOrderDto.PaymentMethod), invalidProperties);
        Assert.Contains(nameof(CreateOrderDto.ShippingFee), invalidProperties);
        Assert.Contains(nameof(CreateOrderDto.Note), invalidProperties);
    }

    [Fact]
    public void AddCartItemDtoValidator_RequiresVariantAndPositiveQuantity()
    {
        var validator = new AddCartItemDtoValidator();
        var dto = new AddCartItemDto
        {
            ProductVariantId = "",
            Quantity = 0
        };

        var result = validator.Validate(dto);
        var invalidProperties = result.Errors.Select(error => error.PropertyName).ToHashSet();

        Assert.False(result.IsValid);
        Assert.Contains(nameof(AddCartItemDto.ProductVariantId), invalidProperties);
        Assert.Contains(nameof(AddCartItemDto.Quantity), invalidProperties);
    }

    [Fact]
    public void SendChatMessageDtoValidator_RejectsOversizedMessageAndUnknownType()
    {
        var validator = new SendChatMessageDtoValidator();
        var dto = new SendChatMessageDto
        {
            ChatRoomId = "room-1",
            Message = new string('m', 5001),
            MessageType = "Unsupported"
        };

        var result = validator.Validate(dto);
        var invalidProperties = result.Errors.Select(error => error.PropertyName).ToHashSet();

        Assert.False(result.IsValid);
        Assert.Contains(nameof(SendChatMessageDto.Message), invalidProperties);
        Assert.Contains(nameof(SendChatMessageDto.MessageType), invalidProperties);
    }

    [Fact]
    public void CreateReviewDtoValidator_RequiresRatingInRangeAndContentLimit()
    {
        var validator = new CreateReviewDtoValidator();
        var dto = new CreateReviewDto
        {
            ProductId = "product-1",
            Rating = 6,
            Content = new string('r', 2001)
        };

        var result = validator.Validate(dto);
        var invalidProperties = result.Errors.Select(error => error.PropertyName).ToHashSet();

        Assert.False(result.IsValid);
        Assert.Contains(nameof(CreateReviewDto.Rating), invalidProperties);
        Assert.Contains(nameof(CreateReviewDto.Content), invalidProperties);
    }
}
