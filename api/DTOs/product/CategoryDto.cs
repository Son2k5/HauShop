using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.product
{
    public class CategoryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ParentId { get; set; }
        public bool IsActive { get; set; }

        // Danh sách các danh mục con (nếu có)
        public List<CategoryDto> Children { get; set; } = new();
    }
}