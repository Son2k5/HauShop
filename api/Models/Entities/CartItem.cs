using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Enum;

namespace api.Models.Entities
{
    public class CartItem
    {
        public string Id { get; set; }
        public string CartId { get; set; }
        public Cart Cart { get; set; }
        public string ProductId { get; set; }
        public Product Product { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public DateTime Created { get; set; }
    }

}