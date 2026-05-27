using System.Security.Claims;
using api.DTOs.order;
using api.services.interfaces.order;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.controllers.order
{
    [ApiController]
    [Route("api/order")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrderController> _logger;

        public OrderController(
            IOrderService orderService,
            ILogger<OrderController> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }

        [HttpPost("checkout")]
        [ProducesResponseType(typeof(CheckoutResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> Checkout([FromBody] CreateOrderDto dto, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return UnauthorizedProblem();

            var result = await _orderService.CheckoutAsync(userId, dto, HttpContext, ct);
            return Ok(result);
        }

        [HttpGet("my")]
        [ProducesResponseType(typeof(PagedOrderDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return UnauthorizedProblem();

            var result = await _orderService.GetMyOrdersAsync(userId, page, pageSize, ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyOrderById(string id, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return UnauthorizedProblem();

            var result = await _orderService.GetMyOrderByIdAsync(userId, id, ct);
            return Ok(result);
        }

        [HttpPatch("{id}/cancel")]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> CancelMyOrder(string id, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId == null)
                return UnauthorizedProblem();

            var result = await _orderService.CancelMyOrderAsync(userId, id, ct);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("vnpay-return")]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> VnPayReturn(CancellationToken ct)
        {
            var result = await _orderService.HandleVnPayReturnAsync(Request.Query, ct);
            return Ok(result);
        }

        private string? TryGetUserId()
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("id") ??
                User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Authenticated request but user id claim was not found.");
                return null;
            }

            return userId;
        }

        private IActionResult UnauthorizedProblem() =>
            Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Instance = HttpContext.Request.Path,
                Extensions =
                {
                    ["traceId"] = HttpContext.TraceIdentifier
                }
            });
    }
}
