using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.product
{
    public class PagedProductDto
    {
        public List<ProductSummaryDto> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage { get; set; }
        public int TotalPages => Total > 0 && PageSize > 0
            ? (int)Math.Ceiling((double)Total / PageSize)
            : 0;
    }
}
