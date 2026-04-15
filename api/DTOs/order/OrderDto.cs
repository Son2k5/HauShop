namespace api.DTOs.order
{
    public class OrderDto
    {
        public string Id { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; }

        public List<OrderItemDto> Items { get; set; }

        public DateTime Created { get; set; }
    }

}