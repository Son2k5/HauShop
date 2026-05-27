using api.DTOs.product;
using api.services.interfaces.product;

namespace api.services.implementations.product;

public sealed class ProductSearchWarmupService : BackgroundService
{
    private static readonly ProductQueryDto[] WarmupQueries =
    [
        new()
        {
            IsActive = true,
            SortBy = "created",
            SortOrder = "desc",
            Page = 1,
            PageSize = 8,
            IncludeTotal = false,
        },
        new()
        {
            Search = "Sneaker",
            IsActive = true,
            SortBy = "created",
            SortOrder = "desc",
            Page = 1,
            PageSize = 4,
            IncludeTotal = false,
        },
        new()
        {
            Search = "Balo",
            IsActive = true,
            SortBy = "created",
            SortOrder = "desc",
            Page = 1,
            PageSize = 4,
            IncludeTotal = false,
        },
    ];

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ProductSearchWarmupService> _logger;
    private readonly int _delaySeconds;

    public ProductSearchWarmupService(
        IServiceScopeFactory scopeFactory,
        ILogger<ProductSearchWarmupService> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _delaySeconds = Math.Clamp(
            configuration.GetValue<int?>("Warmup:ProductSearch:DelaySeconds") ?? 30,
            0,
            300);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            if (_delaySeconds > 0)
            {
                await Task.Delay(TimeSpan.FromSeconds(_delaySeconds), stoppingToken);
            }

            using var scope = _scopeFactory.CreateScope();
            var productService = scope.ServiceProvider.GetRequiredService<IProductService>();

            foreach (var query in WarmupQueries)
            {
                var startedAt = DateTimeOffset.UtcNow;
                await productService.GetProductsAsync(query, stoppingToken);
                _logger.LogInformation(
                    "Product search warmup completed in {ElapsedMs}ms. Search={Search} PageSize={PageSize}",
                    (DateTimeOffset.UtcNow - startedAt).TotalMilliseconds,
                    query.Search,
                    query.PageSize);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Product search warmup failed.");
        }
    }
}
