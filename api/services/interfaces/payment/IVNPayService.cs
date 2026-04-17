using api.models.entities;
using Microsoft.AspNetCore.Http;

namespace api.services.interfaces.payment
{
    public interface IVnPayService
    {
        string CreatePaymentUrl(HttpContext httpContext, Order order, Payment payment);
        bool ValidateSignature(IQueryCollection query);
        DateTime? ParsePayDate(string? value);
    }
}