using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.order
{
    public class CreateOrderDto
    {
        public string ShippingAddressId { get; set; }
        public string? Note { get; set; }
    }
}