using api.data;
using api.DTOs.product;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.controllers.category
{
    [ApiController]
    [Route("api/category")]
    public class CategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<CategoryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<CategoryDto>>> GetAll(CancellationToken ct)
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .OrderBy(category => category.ParentId)
                .ThenBy(category => category.Name)
                .Select(category => new CategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    ParentId = category.ParentId,
                    IsActive = category.IsActive,
                })
                .ToListAsync(ct);

            return Ok(categories);
        }

        [HttpGet("active")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<CategorySummaryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<CategorySummaryDto>>> GetActive(CancellationToken ct)
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .Where(category => category.IsActive)
                .OrderBy(category => category.ParentId)
                .ThenBy(category => category.Name)
                .Select(category => new CategorySummaryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                })
                .ToListAsync(ct);

            return Ok(categories);
        }
    }
}
