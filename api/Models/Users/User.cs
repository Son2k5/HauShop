using System;

namespace api.Models.Users
{
    public class Student
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

    }
}