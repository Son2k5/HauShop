using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.DTOs.product;
using api.services.interfaces.product;

namespace api.controllers.product
{
    [ApiController]

    [Route("api/product")]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _service;
        private readonly IValidator<CreateProductDto> _createValidator;
        private readonly IValidator<UpdateProductDto> _updateValidator;
        private readonly ILogger<ProductController> _logger;

        public ProductController(
            IProductService service,
            IValidator<CreateProductDto> createValidator,
            IValidator<UpdateProductDto> updateValidator,
            ILogger<ProductController> logger)
        {
            _service = service;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _logger = logger;
        }

        // ════════════════════════════════════════════════════════════════════════
        // GET /api/product
        // ?search=&brandId=&categoryId=&minPrice=&maxPrice=&isActive=
        // &sortBy=created|price|name  &sortOrder=asc|desc
        // &page=1  &pageSize=20
        // ════════════════════════════════════════════════════════════════════════
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(PagedProductDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(
            [FromQuery] ProductQueryDto query,
            CancellationToken ct)
        {
            var result = await _service.GetProductsAsync(query, ct);
            return Ok(result);
        }

        // ════════════════════════════════════════════════════════════════════════
        // GET /api/product/{id}
        // ════════════════════════════════════════════════════════════════════════
        [HttpGet("{id}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(string id, CancellationToken ct)
        {
            var product = await _service.GetByIdAsync(id, ct);
            return Ok(product);
        }

        // ════════════════════════════════════════════════════════════════════════
        // GET /api/product/slug/{slug}
        // ════════════════════════════════════════════════════════════════════════
        [HttpGet("slug/{slug}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
        {
            var product = await _service.GetBySlugAsync(slug, ct);
            return Ok(product);
        }

        // ════════════════════════════════════════════════════════════════════════
        // POST /api/product
        // Flow: 1) POST /api/image/upload → nhận imageUrl + imageKey
        //        2) POST /api/product     → đính kèm imageUrl + imageKey
        // ════════════════════════════════════════════════════════════════════════
        [HttpPost]
        [Authorize(Roles = "Admin,Merchant")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create(
            [FromBody] CreateProductDto dto,
            CancellationToken ct)
        {
            var validation = await _createValidator.ValidateAsync(dto, ct);
            if (!validation.IsValid)
                return BadRequest(new { success = false, errors = validation.ToDictionary() });

            var product = await _service.CreateAsync(dto, ct);
            return StatusCode(StatusCodes.Status201Created, product);
        }

        // ════════════════════════════════════════════════════════════════════════
        // PUT /api/product/{id}
        // ════════════════════════════════════════════════════════════════════════
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Merchant")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] UpdateProductDto dto,
            CancellationToken ct)
        {
            var validation = await _updateValidator.ValidateAsync(dto, ct);
            if (!validation.IsValid)
                return BadRequest(new { success = false, errors = validation.ToDictionary() });

            var product = await _service.UpdateAsync(id, dto, ct);
            return Ok(product);
        }

        // ════════════════════════════════════════════════════════════════════════
        // DELETE /api/product/{id}
        // Tự động xóa ảnh Cloudinary
        // ════════════════════════════════════════════════════════════════════════
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Merchant")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(string id, CancellationToken ct)
        {
            await _service.DeleteAsync(id, ct);
            return Ok(new { message = "Xóa sản phẩm thành công" });
        }

        // ════════════════════════════════════════════════════════════════════════
        // PATCH /api/product/{id}/toggle-active
        // ════════════════════════════════════════════════════════════════════════
        [HttpPatch("{id}/toggle-active")]
        [Authorize(Roles = "Admin,Merchant")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleActive(string id, CancellationToken ct)
        {
            var product = await _service.ToggleActiveAsync(id, ct);
            return Ok(product);
        }
    }
}