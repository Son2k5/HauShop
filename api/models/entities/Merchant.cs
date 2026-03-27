using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Enum;

namespace api.Models.Entities
{
    public class Merchant
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string PhoneNumber { get; set; }
        public string BrandName { get; set; }
        public string Business { get; set; }
        public bool IsActive { get; set; }
        public MerchantStatus Status { get; set; }
        public Brand Brand { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }
}