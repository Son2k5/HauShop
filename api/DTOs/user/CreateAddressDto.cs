using System.ComponentModel.DataAnnotations;

namespace api.DTOs.user
{
    public class CreateAddressDto
    {
        [Required]
        public string AddressLine { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        public string? State { get; set; }

        public string? Country { get; set; }

        public string? ZipCode { get; set; }

        public bool IsDefault { get; set; } = false;
    }
}
