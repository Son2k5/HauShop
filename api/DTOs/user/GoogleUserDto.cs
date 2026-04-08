

using System.Text.Json.Serialization;

namespace api.DTOs.user
{
    public class GoogleUserInfoDto
    {
        [JsonPropertyName("sub")]
        public string Sub { get; set; } = string.Empty;       // Google user ID

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("email_verified")]
        public bool EmailVerified { get; set; }

        [JsonPropertyName("given_name")]
        public string GivenName { get; set; } = string.Empty; // First name

        [JsonPropertyName("family_name")]
        public string FamilyName { get; set; } = string.Empty; // Last name

        [JsonPropertyName("picture")]
        public string? Picture { get; set; }                   // Avatar URL

        [JsonPropertyName("name")]
        public string? Name { get; set; }                      // Full name
    }
}