using System.ComponentModel.DataAnnotations;

namespace api.DTOs.cart;

public sealed class MergeGuestCartDto
{
    public List<MergeGuestCartItemDto> Items { get; set; } = new();
}

public sealed class MergeGuestCartItemDto
{
    [Required]
    public string ProductVariantId { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; } = 1;
}
