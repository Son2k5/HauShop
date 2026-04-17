using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.order
{
    public class CheckoutResponseDto
    {
        public OrderDto Order { get; set; }

        public bool RequiresRedirect { get; set; }
        public string? PaymentUrl { get; set; }
    }
}