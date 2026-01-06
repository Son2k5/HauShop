using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models.Enum
{
    public enum CartItemStatus
    {
        NotProcessed = 0,
        Processing = 1,
        Shipped = 2,
        Delivered = 3,
        Cancelled = 4

    }
}