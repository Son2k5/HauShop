using api.DTOs.product;
using api.services.interfaces.category;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.category
{
    [ApiController]
    [Route("api/category")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<CategoryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<CategoryDto>>> GetAll(CancellationToken ct)
        {
            return Ok(await _categoryService.GetAllAsync(ct));
        }

        [HttpGet("active")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<CategorySummaryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<CategorySummaryDto>>> GetActive(CancellationToken ct)
        {
            return Ok(await _categoryService.GetActiveAsync(ct));
        }
    }
}
