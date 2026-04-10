using System;
using System.Collections.Generic;

namespace api.DTOs.cart
{
    public class CartDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public List<CartItemDto> Items { get; set; } = new();
        public int TotalItems => Items.Sum(i => i.Quantity);
        public decimal TotalPrice => Items.Sum(i => i.TotalPrice);
        public DateTime Created { get; set; }
    }
}
