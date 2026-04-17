namespace api.DTOs.user
{
    public class AddressDto
    {
        public string Id { get; set; }
        public string AddressLine { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Country { get; set; }
        public string ZipCode { get; set; }
        public bool IsDefault { get; set; }
        public string DisplayText { get; set; }
    }
}
