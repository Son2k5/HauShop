namespace api.DTOs.cart;

public sealed class MergeGuestCartDto
{
    public List<MergeGuestCartItemDto> Items { get; set; } = new();
}

public sealed class MergeGuestCartItemDto
{
    public string ProductVariantId { get; set; } = string.Empty;

    public int Quantity { get; set; } = 1;
}
