using api.Data;
using api.DTOs;
using api.Helpers;
using api.Models.Entities;
using api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using YourProject.Services.Interfaces;

namespace api.Services.Implememtation.User
{

    public class AuthService
    {
        public readonly ApplicationDbContext _context;
        public readonly ITokenService _tokenService;
        public readonly IEmailService _a;

    }
}