using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models.Entities
{
    public class ProductCategory
    {
        public string ProductId { get; set; }
        public Product Product { get; set; }
        public string CategoryId { get; set; }
        public Category Category { get; set; }
    }

}