using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.services.implementations.seed;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.seed
{
    [ApiController]
    [Route("api/[controller]")]
    [Tags("Seed")]
    public class SeedController : ControllerBase
    {
        private readonly SeedService _seedService;

        public SeedController(SeedService seedService)
        {
            _seedService = seedService;
        }

        /// <summary>
        /// Seed toàn bộ mock data vào database (skip nếu đã tồn tại).
        /// </summary>
        /// <remarks>
        /// Thứ tự insert: Categories → Brands → Products → ProductCategories → ProductVariants.
        /// Nếu record đã tồn tại (theo Id) sẽ được bỏ qua, không bị ghi đè.
        /// </remarks>
        [HttpPost("run")]
        [ProducesResponseType(typeof(SeedResultResponse), 200)]
        [ProducesResponseType(typeof(SeedResultResponse), 500)]
        public async Task<IActionResult> RunSeed()
        {
            var result = await _seedService.SeedAllAsync();

            var response = new SeedResultResponse
            {
                Success = result.Success,
                Message = result.Success
                    ? $"Seed thành công! Đã thêm: {result.Categories} categories, {result.Brands} brands, {result.Products} products, {result.ProductCats} product-categories, {result.Variants} variants."
                    : $"Seed thất bại: {result.Error}",
                Inserted = new InsertedSummary
                {
                    Categories = result.Categories,
                    Brands = result.Brands,
                    Products = result.Products,
                    ProductCategories = result.ProductCats,
                    ProductVariants = result.Variants
                }
            };

            return result.Success ? Ok(response) : StatusCode(500, response);
        }

        /// <summary>
        /// Xoá toàn bộ dữ liệu seed khỏi database.
        /// </summary>
        [HttpDelete("clear")]
        [ProducesResponseType(typeof(SeedResultResponse), 200)]
        [ProducesResponseType(typeof(SeedResultResponse), 500)]
        public async Task<IActionResult> ClearSeed()
        {
            var result = await _seedService.ClearAllAsync();

            var response = new SeedResultResponse
            {
                Success = result.Success,
                Message = result.Success ? result.Message : $"Xoá thất bại: {result.Error}"
            };

            return result.Success ? Ok(response) : StatusCode(500, response);
        }

        /// <summary>
        /// Xoá toàn bộ rồi seed lại từ đầu (reset).
        /// </summary>
        [HttpPost("reset")]
        [ProducesResponseType(typeof(SeedResultResponse), 200)]
        [ProducesResponseType(typeof(SeedResultResponse), 500)]
        public async Task<IActionResult> ResetSeed()
        {
            var clear = await _seedService.ClearAllAsync();
            if (!clear.Success)
                return StatusCode(500, new SeedResultResponse { Success = false, Message = $"Clear thất bại: {clear.Error}" });

            var seed = await _seedService.SeedAllAsync();
            var response = new SeedResultResponse
            {
                Success = seed.Success,
                Message = seed.Success
                    ? $"Reset thành công! Đã thêm: {seed.Categories} categories, {seed.Brands} brands, {seed.Products} products, {seed.ProductCats} product-categories, {seed.Variants} variants."
                    : $"Seed sau clear thất bại: {seed.Error}",
                Inserted = new InsertedSummary
                {
                    Categories = seed.Categories,
                    Brands = seed.Brands,
                    Products = seed.Products,
                    ProductCategories = seed.ProductCats,
                    ProductVariants = seed.Variants
                }
            };

            return seed.Success ? Ok(response) : StatusCode(500, response);
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
    }
}