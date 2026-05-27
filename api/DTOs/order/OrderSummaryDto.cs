namespace api.DTOs.order;

public class OrderSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Created { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}
