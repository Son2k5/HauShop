namespace api.DTOs.order;

public class OrderSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public DateTime Created { get; set; }
}
