using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.order
{
    public class OrderItemDto
    {
        public string ProductName { get; set; }

        public string? VariantSku { get; set; }
        public string? VariantSize { get; set; }
        public string? VariantColor { get; set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total { get; set; }
    }
}