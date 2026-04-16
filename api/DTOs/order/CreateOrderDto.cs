using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using api.models.entities;
using api.models.enums;

namespace api.DTOs.order
{
    public class CreateOrderDto
    {
        [Required]
        public string ShippingAddressId { get; set; } = string.Empty;
        
        [Required]
        public PaymentMethod PaymentMethod {get; set;}

        public decimal ShippingFee {get; set;}
        public string? Note { get; set; }
    }
}