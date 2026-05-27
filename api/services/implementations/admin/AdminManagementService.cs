using System.Text.RegularExpressions;
using api.data;
using api.DTOs.admin;
using api.DTOs.product;
using api.mappings;
using api.models.entities;
using api.models.enums;
using api.services.interfaces.admin;
using api.services.interfaces.cloud;
using api.services.interfaces.notification;
using Microsoft.EntityFrameworkCore;

namespace api.services.implementations.admin
{
    public class AdminManagementService : IAdminManagementService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<AdminManagementService> _logger;

        private static readonly Dictionary<string, string> VietnameseMap = new()
        {
            {"à","a"},{"á","a"},{"ả","a"},{"ã","a"},{"ạ","a"},
            {"ă","a"},{"ằ","a"},{"ắ","a"},{"ẳ","a"},{"ẵ","a"},{"ặ","a"},
            {"â","a"},{"ầ","a"},{"ấ","a"},{"ẩ","a"},{"ẫ","a"},{"ậ","a"},
            {"đ","d"},
            {"è","e"},{"é","e"},{"ẻ","e"},{"ẽ","e"},{"ẹ","e"},
            {"ê","e"},{"ề","e"},{"ế","e"},{"ể","e"},{"ễ","e"},{"ệ","e"},
            {"ì","i"},{"í","i"},{"ỉ","i"},{"ĩ","i"},{"ị","i"},
            {"ò","o"},{"ó","o"},{"ỏ","o"},{"õ","o"},{"ọ","o"},
            {"ô","o"},{"ồ","o"},{"ố","o"},{"ổ","o"},{"ỗ","o"},{"ộ","o"},
            {"ơ","o"},{"ờ","o"},{"ớ","o"},{"ở","o"},{"ỡ","o"},{"ợ","o"},
            {"ù","u"},{"ú","u"},{"ủ","u"},{"ũ","u"},{"ụ","u"},
            {"ư","u"},{"ừ","u"},{"ứ","u"},{"ử","u"},{"ữ","u"},{"ự","u"},
            {"ỳ","y"},{"ý","y"},{"ỷ","y"},{"ỹ","y"},{"ỵ","y"},
        };

        public AdminManagementService(
            ApplicationDbContext context,
            ICloudinaryService cloudinaryService,
            INotificationService notificationService,
            ILogger<AdminManagementService> logger)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<AdminPagedResultDto<AdminUserListItemDto>> GetUsersAsync(
            string? search = null,
            string? role = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Users.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var normalizedSearch = search.Trim();
                query = query.Where(u =>
                    u.Email.Contains(normalizedSearch) ||
                    u.FirstName.Contains(normalizedSearch) ||
                    (u.LastName != null && u.LastName.Contains(normalizedSearch)) ||
                    (u.PhoneNumber != null && u.PhoneNumber.Contains(normalizedSearch)));
            }

            if (!string.IsNullOrWhiteSpace(role) &&
                Enum.TryParse<Role>(role, true, out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }

            var total = await query.CountAsync(ct);

            var items = await query
                .OrderByDescending(u => u.Created)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new AdminUserListItemDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = ((u.FirstName ?? string.Empty) + " " + (u.LastName ?? string.Empty)).Trim(),
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role.ToString(),
                    MerchantId = u.MerchantId,
                    IsOnline = u.IsOnline,
                    Created = u.Created,
                    LastSeen = u.LastSeen
                })
                .ToListAsync(ct);

            return new AdminPagedResultDto<AdminUserListItemDto>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        public async Task<AdminUserDetailDto> GetUserByIdAsync(string userId, CancellationToken ct = default)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, ct)
                ?? throw new KeyNotFoundException("User not found");

            var orderStats = await _context.Orders
                .AsNoTracking()
                .Where(o => o.UserId == userId)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    TotalOrders = g.Count(),
                    TotalSpent = g.Sum(x => x.Total),
                    LastOrderAt = g.Max(x => (DateTime?)x.Created)
                })
                .FirstOrDefaultAsync(ct);

            return new AdminUserDetailDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = ((user.FirstName ?? string.Empty) + " " + (user.LastName ?? string.Empty)).Trim(),
                PhoneNumber = user.PhoneNumber,
                Role = user.Role.ToString(),
                MerchantId = user.MerchantId,
                IsOnline = user.IsOnline,
                Created = user.Created,
                LastSeen = user.LastSeen,
                TotalOrders = orderStats?.TotalOrders ?? 0,
                TotalSpent = orderStats?.TotalSpent ?? 0m,
                LastOrderAt = orderStats?.LastOrderAt
            };
        }

        public async Task<AdminUserDetailDto> UpdateUserAsync(
            string userId,
            AdminUpdateUserDto dto,
            CancellationToken ct = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
                ?? throw new KeyNotFoundException("User not found");

            if (dto.Email != null)
            {
                var email = dto.Email.Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(email))
                {
                    throw new ArgumentException("Email is required.");
                }

                var emailExists = await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Id != userId && u.Email == email, ct);

                if (emailExists)
                {
                    throw new ArgumentException("Email already exists.");
                }

                user.Email = email;
            }

            if (dto.FirstName != null)
            {
                var firstName = dto.FirstName.Trim();
                if (string.IsNullOrWhiteSpace(firstName))
                {
                    throw new ArgumentException("First name is required.");
                }

                user.FirstName = firstName;
            }

            if (dto.LastName != null)
            {
                user.LastName = dto.LastName.Trim();
            }

            if (dto.PhoneNumber != null)
            {
                user.PhoneNumber = dto.PhoneNumber.Trim();
            }

            if (dto.MerchantId != null)
            {
                var merchantId = dto.MerchantId.Trim();
                if (string.IsNullOrWhiteSpace(merchantId))
                {
                    if (user.Role == Role.Merchant)
                    {
                        throw new ArgumentException("MerchantId is required for Merchant role.");
                    }

                    user.MerchantId = null;
                }
                else
                {
                    var merchantExists = await _context.Merchants
                        .AsNoTracking()
                        .AnyAsync(m => m.Id == merchantId, ct);

                    if (!merchantExists)
                    {
                        throw new KeyNotFoundException("Merchant not found");
                    }

                    user.MerchantId = merchantId;
                }
            }

            user.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);

            return await GetUserByIdAsync(userId, ct);
        }

        public async Task<AdminUserDetailDto> UpdateUserRoleAsync(
            string userId,
            AdminUpdateUserRoleDto dto,
            CancellationToken ct = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
                ?? throw new KeyNotFoundException("User not found");

            if (dto.Role == Role.Merchant)
            {
                if (string.IsNullOrWhiteSpace(dto.MerchantId))
                {
                    throw new ArgumentException("MerchantId is required when assigning Merchant role.");
                }

                var merchantExists = await _context.Merchants
                    .AsNoTracking()
                    .AnyAsync(m => m.Id == dto.MerchantId, ct);

                if (!merchantExists)
                {
                    throw new KeyNotFoundException("Merchant not found");
                }
            }

            user.Role = dto.Role;
            user.MerchantId = dto.Role == Role.Merchant ? dto.MerchantId?.Trim() : null;
            user.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);

            return await GetUserByIdAsync(userId, ct);
        }

        public async Task<AdminPagedResultDto<AdminOrderListItemDto>> GetOrdersAsync(
            string? search = null,
            string? status = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Orders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var normalizedSearch = search.Trim();
                query = query.Where(o =>
                    o.Id.Contains(normalizedSearch) ||
                    o.User.Email.Contains(normalizedSearch) ||
                    o.ReceiverName.Contains(normalizedSearch) ||
                    o.ReceiverPhone.Contains(normalizedSearch));
            }

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(o => o.Status == parsedStatus);
            }

            var total = await query.CountAsync(ct);

            var items = await query
                .OrderByDescending(o => o.Created)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new AdminOrderListItemDto
                {
                    Id = o.Id,
                    UserId = o.UserId,
                    CustomerName = ((o.User.FirstName ?? string.Empty) + " " + (o.User.LastName ?? string.Empty)).Trim(),
                    ReceiverName = o.ReceiverName,
                    ReceiverPhone = o.ReceiverPhone,
                    Total = o.Total,
                    Status = o.Status.ToString(),
                    PaymentStatus = o.Payments
                        .OrderByDescending(p => p.Created)
                        .Select(p => p.Status.ToString())
                        .FirstOrDefault() ?? "Pending",
                    ItemCount = o.OrderItems.Sum(i => i.Quantity),
                    Created = o.Created,
                    Updated = o.Updated
                })
                .ToListAsync(ct);

            return new AdminPagedResultDto<AdminOrderListItemDto>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        public async Task<AdminOrderDetailDto> GetOrderByIdAsync(string orderId, CancellationToken ct = default)
        {
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.Id == orderId, ct)
                ?? throw new KeyNotFoundException("Order not found");

            return new AdminOrderDetailDto
            {
                Id = order.Id,
                UserId = order.UserId,
                CustomerName = ((order.User.FirstName ?? string.Empty) + " " + (order.User.LastName ?? string.Empty)).Trim(),
                CustomerEmail = order.User.Email,
                ReceiverName = order.ReceiverName,
                ReceiverPhone = order.ReceiverPhone,
                AddressLine = order.AddressLine,
                Subtotal = order.Subtotal,
                ShippingFee = order.ShippingFee,
                Total = order.Total,
                Status = order.Status.ToString(),
                PaymentStatus = order.Payments
                    .OrderByDescending(p => p.Created)
                    .Select(p => p.Status.ToString())
                    .FirstOrDefault() ?? "Pending",
                Created = order.Created,
                Updated = order.Updated,
                Items = order.OrderItems
                    .OrderBy(i => i.Created)
                    .Select(i => new AdminOrderItemDto
                    {
                        ProductId = i.ProductId,
                        ProductVariantId = i.ProductVariantId,
                        ProductName = i.ProductName,
                        VariantSku = i.VariantSku,
                        VariantSize = i.VariantSize,
                        VariantColor = i.VariantColor,
                        Quantity = i.Quantity,
                        Price = i.Price,
                        Total = i.Total
                    })
                    .ToList()
            };
        }

        public async Task<AdminOrderDetailDto> UpdateOrderStatusAsync(
            string orderId,
            AdminUpdateOrderStatusDto dto,
            CancellationToken ct = default)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct)
                ?? throw new KeyNotFoundException("Order not found");

            if (!IsValidStatusTransition(order.Status, dto.Status))
            {
                throw new InvalidOperationException(
                    $"Cannot change order status from {order.Status} to {dto.Status}.");
            }

            var previousStatus = order.Status;
            order.Status = dto.Status;
            order.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            await TryNotifyOrderStatusChangedAsync(orderId, previousStatus, dto.Status, ct);

            return await GetOrderByIdAsync(orderId, ct);
        }

        public async Task<AdminPagedResultDto<ProductSummaryDto>> GetProductsAsync(
            string? search = null,
            bool? isActive = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Products
                .AsNoTracking()
                .Include(p => p.Brand)
                .Include(p => p.ProductCategories)
                    .ThenInclude(pc => pc.Category)
                .Include(p => p.ProductVariants)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var normalizedSearch = search.Trim();
                query = query.Where(p =>
                    p.Name.Contains(normalizedSearch) ||
                    p.Sku.Contains(normalizedSearch) ||
                    p.Slug.Contains(normalizedSearch));
            }

            if (isActive.HasValue)
            {
                query = query.Where(p => p.IsActive == isActive.Value);
            }

            var total = await query.CountAsync(ct);

            var items = await query
                .OrderByDescending(p => p.Created)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductSummaryDto
                {
                    Id = p.Id,
                    Sku = p.Sku,
                    Name = p.Name,
                    Slug = p.Slug,
                    ImageUrl = p.ImageUrl,
                    Price = p.Price,
                    MinVariantPrice = p.ProductVariants.Where(v => v.IsActive).Select(v => (decimal?)v.Price).Min(),
                    DefaultVariantId = p.ProductVariants.Where(v => v.IsActive).OrderBy(v => v.Id).Select(v => v.Id).FirstOrDefault(),
                    TotalStock = p.ProductVariants.Any(v => v.IsActive)
                        ? p.ProductVariants.Where(v => v.IsActive).Sum(v => (int?)v.Stock) ?? 0
                        : p.Stock,
                    Stock = p.Stock,
                    AverageRating = p.AverageRating,
                    ReviewCount = p.ReviewCount,
                    IsActive = p.IsActive,
                    BrandId = p.BrandId,
                    BrandName = p.Brand != null ? p.Brand.Name : null,
                    Categories = p.ProductCategories
                        .Where(pc => pc.Category != null)
                        .Select(pc => new CategorySummaryDto
                        {
                            Id = pc.CategoryId,
                            Name = pc.Category!.Name,
                            Slug = pc.Category.Slug
                        })
                        .ToList(),
                    Created = p.Created
                })
                .ToListAsync(ct);

            return new AdminPagedResultDto<ProductSummaryDto>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        public async Task<ProductDto> GetProductByIdAsync(string productId, CancellationToken ct = default)
        {
            var product = await GetProductEntityAsync(productId, ct);
            return ProductMapping.MapToDto(product);
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto dto, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.Sku))
            {
                throw new ArgumentException("SKU is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new ArgumentException("Product name is required.");
            }

            if (dto.Price < 0 || dto.Stock < 0 || dto.AverageRating < 0 || dto.AverageRating > 5 || dto.ReviewCount < 0)
            {
                throw new ArgumentException("Invalid product values.");
            }

            var normalizedSku = dto.Sku.Trim();
            var skuExists = await _context.Products.AsNoTracking().AnyAsync(p => p.Sku == normalizedSku, ct);
            if (skuExists)
            {
                throw new InvalidOperationException($"SKU '{normalizedSku}' already exists.");
            }

            if (!string.IsNullOrWhiteSpace(dto.BrandId))
            {
                var brandExists = await _context.Brands.AsNoTracking().AnyAsync(b => b.Id == dto.BrandId, ct);
                if (!brandExists)
                {
                    throw new KeyNotFoundException("Brand not found");
                }
            }

            var slug = await BuildUniqueSlugAsync(dto.Slug ?? dto.Name, null, ct);

            var product = new Product
            {
                Id = Guid.NewGuid().ToString(),
                Sku = normalizedSku,
                Name = dto.Name.Trim(),
                Slug = slug,
                Description = dto.Description?.Trim() ?? string.Empty,
                Price = dto.Price,
                Taxable = dto.Taxable,
                IsActive = dto.IsActive,
                BrandId = string.IsNullOrWhiteSpace(dto.BrandId) ? null : dto.BrandId.Trim(),
                ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty,
                ImageKey = dto.ImageKey?.Trim() ?? string.Empty,
                Stock = dto.Stock,
                AverageRating = dto.AverageRating,
                ReviewCount = dto.ReviewCount,
                Created = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync(ct);

            await SyncCategoriesAsync(product.Id, dto.CategoryIds, ct);
            return await GetProductByIdAsync(product.Id, ct);
        }

        public async Task<ProductDto> UpdateProductAsync(
            string productId,
            UpdateProductDto dto,
            CancellationToken ct = default)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId, ct)
                ?? throw new KeyNotFoundException("Product not found");

            if (dto.Sku != null)
            {
                var sku = dto.Sku.Trim();
                if (string.IsNullOrWhiteSpace(sku))
                {
                    throw new ArgumentException("SKU is required.");
                }

                var skuExists = await _context.Products
                    .AsNoTracking()
                    .AnyAsync(p => p.Id != productId && p.Sku == sku, ct);

                if (skuExists)
                {
                    throw new InvalidOperationException($"SKU '{sku}' already exists.");
                }

                product.Sku = sku;
            }

            if (dto.Name != null)
            {
                var name = dto.Name.Trim();
                if (string.IsNullOrWhiteSpace(name))
                {
                    throw new ArgumentException("Product name is required.");
                }

                product.Name = name;
                if (dto.Slug == null)
                {
                    product.Slug = await BuildUniqueSlugAsync(name, productId, ct);
                }
            }

            if (dto.Slug != null)
            {
                product.Slug = await BuildUniqueSlugAsync(dto.Slug, productId, ct);
            }

            if (dto.Description != null)
            {
                product.Description = dto.Description.Trim();
            }

            if (dto.Price.HasValue)
            {
                if (dto.Price.Value < 0) throw new ArgumentException("Price must be greater than or equal to 0.");
                product.Price = dto.Price.Value;
            }

            if (dto.Stock.HasValue)
            {
                if (dto.Stock.Value < 0) throw new ArgumentException("Stock must be greater than or equal to 0.");
                product.Stock = dto.Stock.Value;
            }

            if (dto.AverageRating.HasValue)
            {
                if (dto.AverageRating.Value < 0 || dto.AverageRating.Value > 5)
                {
                    throw new ArgumentException("AverageRating must be between 0 and 5.");
                }

                product.AverageRating = dto.AverageRating.Value;
            }

            if (dto.ReviewCount.HasValue)
            {
                if (dto.ReviewCount.Value < 0)
                {
                    throw new ArgumentException("ReviewCount must be greater than or equal to 0.");
                }

                product.ReviewCount = dto.ReviewCount.Value;
            }

            if (dto.Taxable.HasValue) product.Taxable = dto.Taxable.Value;
            if (dto.IsActive.HasValue) product.IsActive = dto.IsActive.Value;

            if (dto.BrandId != null)
            {
                if (dto.BrandId == "null" || string.IsNullOrWhiteSpace(dto.BrandId))
                {
                    product.BrandId = null;
                }
                else
                {
                    var brandId = dto.BrandId.Trim();
                    var brandExists = await _context.Brands.AsNoTracking().AnyAsync(b => b.Id == brandId, ct);
                    if (!brandExists)
                    {
                        throw new KeyNotFoundException("Brand not found");
                    }

                    product.BrandId = brandId;
                }
            }

            var oldImageKey = product.ImageKey;

            if (dto.ImageUrl != null)
            {
                product.ImageUrl = dto.ImageUrl.Trim();
            }

            if (dto.ImageKey != null)
            {
                product.ImageKey = dto.ImageKey.Trim();
            }

            product.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);

            if (dto.CategoryIds != null)
            {
                await SyncCategoriesAsync(productId, dto.CategoryIds, ct);
            }

            if (!string.IsNullOrWhiteSpace(oldImageKey) &&
                !string.Equals(oldImageKey, product.ImageKey, StringComparison.Ordinal))
            {
                await TryDeleteCloudinaryAssetAsync(oldImageKey);
            }

            return await GetProductByIdAsync(productId, ct);
        }

        public async Task DeleteProductAsync(string productId, CancellationToken ct = default)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId, ct)
                ?? throw new KeyNotFoundException("Product not found");

            var imageKey = product.ImageKey;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync(ct);

            if (!string.IsNullOrWhiteSpace(imageKey))
            {
                await TryDeleteCloudinaryAssetAsync(imageKey);
            }
        }

        public async Task<ProductDto> ToggleProductActiveAsync(string productId, CancellationToken ct = default)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId, ct)
                ?? throw new KeyNotFoundException("Product not found");

            product.IsActive = !product.IsActive;
            product.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);

            return await GetProductByIdAsync(productId, ct);
        }

        public async Task<AdminInventoryOverviewDto> GetInventoryOverviewAsync(
            int lowStockThreshold = 5,
            CancellationToken ct = default)
        {
            lowStockThreshold = Math.Max(lowStockThreshold, 0);

            var inventoryQuery = _context.Products
                .AsNoTracking()
                .Select(p => new
                {
                    p.Id,
                    p.Sku,
                    p.Name,
                    p.IsActive,
                    EffectiveStock = p.ProductVariants.Any(v => v.IsActive)
                        ? p.ProductVariants.Where(v => v.IsActive).Sum(v => (int?)v.Stock) ?? 0
                        : p.Stock
                });

            var totalProducts = await _context.Products.CountAsync(ct);
            var activeProducts = await _context.Products.CountAsync(p => p.IsActive, ct);
            var totalVariants = await _context.ProductVariants.CountAsync(ct);
            var activeVariants = await _context.ProductVariants.CountAsync(v => v.IsActive, ct);
            var totalStock = await inventoryQuery.SumAsync(x => x.EffectiveStock, ct);
            var lowStockCount = await inventoryQuery.CountAsync(x => x.IsActive && x.EffectiveStock <= lowStockThreshold, ct);
            var outOfStockCount = await inventoryQuery.CountAsync(x => x.IsActive && x.EffectiveStock <= 0, ct);

            var lowStockProducts = await inventoryQuery
                .Where(x => x.IsActive && x.EffectiveStock <= lowStockThreshold)
                .OrderBy(x => x.EffectiveStock)
                .ThenBy(x => x.Name)
                .Take(20)
                .Select(x => new LowStockProductDto
                {
                    Id = x.Id,
                    Sku = x.Sku,
                    Name = x.Name,
                    Stock = x.EffectiveStock,
                    IsActive = x.IsActive
                })
                .ToListAsync(ct);

            return new AdminInventoryOverviewDto
            {
                TotalProducts = totalProducts,
                ActiveProducts = activeProducts,
                TotalVariants = totalVariants,
                ActiveVariants = activeVariants,
                TotalStock = totalStock,
                LowStockCount = lowStockCount,
                OutOfStockCount = outOfStockCount,
                LowStockProducts = lowStockProducts
            };
        }

        public async Task<ProductDto> UpdateInventoryAsync(
            string productId,
            AdminUpdateInventoryDto dto,
            CancellationToken ct = default)
        {
            var product = await _context.Products
                .Include(p => p.ProductVariants)
                .FirstOrDefaultAsync(p => p.Id == productId, ct)
                ?? throw new KeyNotFoundException("Product not found");

            if (dto.Stock.HasValue)
            {
                if (dto.Stock.Value < 0)
                {
                    throw new ArgumentException("Stock must be greater than or equal to 0.");
                }

                product.Stock = dto.Stock.Value;
            }

            if (dto.Variants.Count > 0)
            {
                foreach (var variantDto in dto.Variants)
                {
                    var variant = product.ProductVariants.FirstOrDefault(v => v.Id == variantDto.VariantId)
                        ?? throw new KeyNotFoundException($"Variant not found: {variantDto.VariantId}");

                    if (variantDto.Stock < 0)
                    {
                        throw new ArgumentException("Variant stock must be greater than or equal to 0.");
                    }

                    variant.Stock = variantDto.Stock;
                    if (variantDto.IsActive.HasValue)
                    {
                        variant.IsActive = variantDto.IsActive.Value;
                    }

                    variant.UpdateAt = DateTime.UtcNow;
                }

                if (product.ProductVariants.Any(v => v.IsActive))
                {
                    product.Stock = product.ProductVariants.Where(v => v.IsActive).Sum(v => v.Stock);
                }
            }

            product.Updated = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            return await GetProductByIdAsync(productId, ct);
        }

        public async Task<AdminSettingsDto> GetSettingsAsync(CancellationToken ct = default)
        {
            var settings = await GetOrCreateSettingsAsync(ct);
            return MapSettings(settings);
        }

        public async Task<AdminSettingsDto> UpdateSettingsAsync(
            UpdateAdminSettingsDto dto,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.StoreName))
            {
                throw new ArgumentException("Store name is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.SupportEmail))
            {
                throw new ArgumentException("Support email is required.");
            }

            var settings = await GetOrCreateSettingsAsync(ct);

            settings.StoreName = dto.StoreName.Trim();
            settings.SupportEmail = dto.SupportEmail.Trim();
            settings.SupportPhone = dto.SupportPhone?.Trim();
            settings.LowStockThreshold = Math.Max(dto.LowStockThreshold, 0);
            settings.RecentOrdersLimit = Math.Clamp(dto.RecentOrdersLimit, 1, 20);
            settings.EnableOrderNotifications = dto.EnableOrderNotifications;
            settings.EnableInventoryAlerts = dto.EnableInventoryAlerts;
            settings.EnableWeeklySummary = dto.EnableWeeklySummary;
            settings.Updated = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);

            return MapSettings(settings);
        }

        private async Task<Product> GetProductEntityAsync(string productId, CancellationToken ct)
        {
            return await _context.Products
                .AsNoTracking()
                .Include(p => p.Brand)
                .Include(p => p.ProductCategories)
                    .ThenInclude(pc => pc.Category)
                .Include(p => p.ProductVariants)
                .FirstOrDefaultAsync(p => p.Id == productId, ct)
                ?? throw new KeyNotFoundException("Product not found");
        }

        private async Task SyncCategoriesAsync(string productId, List<string>? categoryIds, CancellationToken ct)
        {
            var normalizedIds = (categoryIds ?? new List<string>())
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim())
                .Distinct()
                .ToList();

            if (normalizedIds.Count > 0)
            {
                var existingCount = await _context.Categories
                    .AsNoTracking()
                    .CountAsync(c => normalizedIds.Contains(c.Id), ct);

                if (existingCount != normalizedIds.Count)
                {
                    throw new KeyNotFoundException("One or more categories were not found.");
                }
            }

            var existingLinks = await _context.ProductCategories
                .Where(pc => pc.ProductId == productId)
                .ToListAsync(ct);

            _context.ProductCategories.RemoveRange(existingLinks);

            if (normalizedIds.Count > 0)
            {
                var nextLinks = normalizedIds.Select(categoryId => new ProductCategory
                {
                    ProductId = productId,
                    CategoryId = categoryId
                });

                await _context.ProductCategories.AddRangeAsync(nextLinks, ct);
            }

            await _context.SaveChangesAsync(ct);
        }

        private async Task<string> BuildUniqueSlugAsync(string input, string? excludingProductId, CancellationToken ct)
        {
            var baseSlug = BuildSlug(input);
            if (string.IsNullOrWhiteSpace(baseSlug))
            {
                throw new ArgumentException("Slug is invalid.");
            }

            var slug = baseSlug;
            var exists = await _context.Products
                .AsNoTracking()
                .AnyAsync(p => p.Slug == slug && p.Id != excludingProductId, ct);

            if (!exists)
            {
                return slug;
            }

            slug = $"{baseSlug}-{Guid.NewGuid().ToString("N")[..6]}";
            return slug;
        }

        private static string BuildSlug(string input)
        {
            var slug = input.Trim().ToLowerInvariant();
            foreach (var kv in VietnameseMap)
            {
                slug = slug.Replace(kv.Key, kv.Value);
            }

            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug.Trim(), @"\s+", "-");
            return slug;
        }

        private async Task TryDeleteCloudinaryAssetAsync(string imageKey)
        {
            try
            {
                await _cloudinaryService.DeleteAsync(imageKey);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete Cloudinary asset {ImageKey}", imageKey);
            }
        }

        private async Task<AdminSetting> GetOrCreateSettingsAsync(CancellationToken ct)
        {
            var settings = await _context.AdminSettings.FirstOrDefaultAsync(x => x.Id == "default", ct);
            if (settings is not null)
            {
                return settings;
            }

            settings = new AdminSetting
            {
                Id = "default",
            };

            _context.AdminSettings.Add(settings);
            await _context.SaveChangesAsync(ct);
            return settings;
        }

        private static AdminSettingsDto MapSettings(AdminSetting settings)
        {
            return new AdminSettingsDto
            {
                StoreName = settings.StoreName,
                SupportEmail = settings.SupportEmail,
                SupportPhone = settings.SupportPhone,
                LowStockThreshold = settings.LowStockThreshold,
                RecentOrdersLimit = settings.RecentOrdersLimit,
                EnableOrderNotifications = settings.EnableOrderNotifications,
                EnableInventoryAlerts = settings.EnableInventoryAlerts,
                EnableWeeklySummary = settings.EnableWeeklySummary,
                Updated = settings.Updated ?? settings.Created
            };
        }

        private static bool IsValidStatusTransition(OrderStatus currentStatus, OrderStatus nextStatus)
        {
            if (currentStatus == nextStatus)
            {
                return true;
            }

            return currentStatus switch
            {
                OrderStatus.Pending => nextStatus is OrderStatus.Processing or OrderStatus.Cancelled,
                OrderStatus.Processing => nextStatus is OrderStatus.Shipping or OrderStatus.Cancelled,
                OrderStatus.Shipping => nextStatus == OrderStatus.Completed,
                OrderStatus.Completed => nextStatus == OrderStatus.ReturnRequested,
                OrderStatus.ReturnRequested => nextStatus == OrderStatus.ReturnApproved,
                OrderStatus.ReturnApproved => nextStatus == OrderStatus.Returned,
                OrderStatus.Returned => nextStatus == OrderStatus.Refunded,
                OrderStatus.Cancelled => false,
                OrderStatus.Refunded => false,
                _ => false
            };
        }

        private async Task TryNotifyOrderStatusChangedAsync(
            string orderId,
            OrderStatus previousStatus,
            OrderStatus nextStatus,
            CancellationToken ct)
        {
            try
            {
                await _notificationService.NotifyOrderStatusChangedAsync(orderId, previousStatus, nextStatus, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Order status notification failed. OrderId={OrderId}, PreviousStatus={PreviousStatus}, NextStatus={NextStatus}",
                    orderId,
                    previousStatus,
                    nextStatus);
            }
        }
    }
}
