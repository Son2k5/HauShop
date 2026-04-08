using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using api.models.enums;

namespace api.models.entities
{
    public class Brand
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public byte[]? ImageData { get; set; }
        public string? ImageContentType { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
        public string? MerchantId { get; set; }
        public Merchant? Merchant { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
        public ICollection<Product> Products { get; set; }
    }
}