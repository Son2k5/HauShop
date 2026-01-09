using api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class test : ControllerBase
    {
        private readonly IEmailService _emailService;

        public test(IEmailService emailService)
        {
            _emailService = emailService;
        }

        [HttpGet("send")]
        public async Task<IActionResult> SendHelloEmail()
        {
            var to = "sonct2k3@gmail.com"; // 👈 Gmail của bạn
            var subject = "Test Email";
            var body = "<h1>hello email</h1>";

            await _emailService.SendEmailAsync(to, subject, body);

            return Ok("Email sent");
        }
    }
}
