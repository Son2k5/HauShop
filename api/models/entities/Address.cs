using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.models.entities;

namespace api.models.entities
{
    public class Address
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public User User { get; set; }
        public string AddressLine { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Country { get; set; }
        public string ZipCode { get; set; }
        public bool IsDefault { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }
}