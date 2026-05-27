namespace api.DTOs.order;

public class PagedOrderDto
{
    public List<OrderSummaryDto> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0
        ? (int)Math.Ceiling((double)Total / PageSize)
        : 0;
}
