using api.models.enums;
using api.services.implementations.seed;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.seed
{
    [ApiController]
    [Route("api/seed")]
    [Tags("Seed")]
    [Authorize(Roles = nameof(Role.Admin))]
    public class SeedController : ControllerBase
    {
        private readonly SeedService _seedService;

        public SeedController(SeedService seedService)
        {
            _seedService = seedService;
        }

        [HttpPost("run")]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> RunSeed()
        {
            var result = await _seedService.SeedAllAsync();
            var response = BuildResponse(
                result,
                $"Seed thanh cong. Da them: {FormatInserted(result)}.",
                $"Seed that bai: {result.Error}");

            return result.Success ? Ok(response) : StatusCode(StatusCodes.Status500InternalServerError, response);
        }

        [HttpPost("orders/run")]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> RunCustomerOrderSeed()
        {
            var result = await _seedService.SeedCustomerOrderAsync();
            var response = BuildResponse(
                result,
                $"Seed order khach hang thanh cong. Da them: {FormatInserted(result)}.",
                $"Seed order khach hang that bai: {result.Error}");

            return result.Success ? Ok(response) : StatusCode(StatusCodes.Status500InternalServerError, response);
        }

        [HttpDelete("orders/clear")]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ClearCustomerOrderSeed()
        {
            var result = await _seedService.ClearCustomerOrderAsync();
            var response = BuildResponse(
                result,
                result.Message,
                $"Xoa order seed khach hang that bai: {result.Error}");

            return result.Success ? Ok(response) : StatusCode(StatusCodes.Status500InternalServerError, response);
        }

        [HttpDelete("clear")]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ClearSeed()
        {
            var result = await _seedService.ClearAllAsync();
            var response = BuildResponse(
                result,
                result.Message,
                $"Xoa seed that bai: {result.Error}");

            return result.Success ? Ok(response) : StatusCode(StatusCodes.Status500InternalServerError, response);
        }

        [HttpPost("reset")]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(SeedResultResponse), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ResetSeed()
        {
            var clear = await _seedService.ClearAllAsync();
            if (!clear.Success)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new SeedResultResponse
                    {
                        Success = false,
                        Message = $"Clear seed that bai: {clear.Error}"
                    });
            }

            var seed = await _seedService.SeedAllAsync();
            var response = BuildResponse(
                seed,
                $"Reset seed thanh cong. Da them: {FormatInserted(seed)}.",
                $"Seed sau clear that bai: {seed.Error}");

            return seed.Success ? Ok(response) : StatusCode(StatusCodes.Status500InternalServerError, response);
        }

        private static SeedResultResponse BuildResponse(
            SeedResult result,
            string successMessage,
            string failureMessage)
        {
            return new SeedResultResponse
            {
                Success = result.Success,
                Message = result.Success ? successMessage : failureMessage,
                Inserted = new InsertedSummary
                {
                    Categories = result.Categories,
                    Brands = result.Brands,
                    Products = result.Products,
                    ProductCategories = result.ProductCats,
                    ProductVariants = result.Variants,
                    Users = result.Users,
                    Addresses = result.Addresses,
                    Orders = result.Orders
                }
            };
        }

        private static string FormatInserted(SeedResult result)
        {
            return $"{result.Categories} categories, {result.Brands} brands, {result.Products} products, " +
                   $"{result.ProductCats} product-categories, {result.Variants} variants, " +
                   $"{result.Users} users, {result.Addresses} addresses, {result.Orders} orders";
        }
    }

    public class SeedResultResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public InsertedSummary? Inserted { get; set; }
    }

    public class InsertedSummary
    {
        public int Categories { get; set; }
        public int Brands { get; set; }
        public int Products { get; set; }
        public int ProductCategories { get; set; }
        public int ProductVariants { get; set; }
        public int Users { get; set; }
        public int Addresses { get; set; }
        public int Orders { get; set; }
    }
}
