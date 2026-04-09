using api.DTOs.product;
using api.mappings;
using api.models.entities;
using api.repositories.interfaces;
using api.services.interfaces.cloud;
using api.services.interfaces.product;
using System.Text.RegularExpressions;

namespace api.services.implementations.product
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _repo;
        private readonly ICloudinaryService _cloudinary;
        private readonly ILogger<ProductService> _logger;

        public ProductService(
            IProductRepository repo,
            ICloudinaryService cloudinary,
            ILogger<ProductService> logger)
        {
            _repo = repo;
            _cloudinary = cloudinary;
            _logger = logger;
        }

        // ── Read ─────────────────────────────────────────────────────────────────

        public async Task<PagedProductDto> GetProductsAsync(
            ProductQueryDto query,
            CancellationToken ct = default)
        {
            // Repo đã project thẳng sang DTO — không cần map lại
            // Repo đã tự clamp Page và PageSize
            var (items, total) = await _repo.GetPagedAsync(query, ct);

            return new PagedProductDto
            {
                Items = items,
                Total = total,
                Page = query.Page,
                PageSize = query.PageSize,
            };
        }

        public async Task<ProductDto> GetByIdAsync(string id, CancellationToken ct = default)
        {
            var product = await _repo.GetByIdWithIncludesAsync(id, ct)
                ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm: {id}");

            return ProductMapping.MapToDto(product);
        }

        public async Task<ProductDto> GetBySlugAsync(string slug, CancellationToken ct = default)
        {
            var product = await _repo.GetBySlugAsync(slug, ct)
                ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm: {slug}");

            return ProductMapping.MapToDto(product);
        }

        // ── Create ───────────────────────────────────────────────────────────────

        public async Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken ct = default)
        {
            if (await _repo.ExistsSkuAsync(dto.Sku, ct: ct))
                throw new InvalidOperationException($"SKU '{dto.Sku}' đã tồn tại");

            var slug = BuildSlug(dto.Slug ?? dto.Name);
            if (await _repo.ExistsSlugAsync(slug, ct: ct))
                slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";

            var product = new Product
            {
                Id = Guid.NewGuid().ToString(),
                Sku = dto.Sku.Trim(),
                Name = dto.Name.Trim(),
                Slug = slug,
                Description = dto.Description?.Trim() ?? string.Empty,
                Price = dto.Price,
                Taxable = dto.Taxable,
                IsActive = dto.IsActive,
                BrandId = string.IsNullOrEmpty(dto.BrandId) ? null : dto.BrandId,
                ImageUrl = dto.ImageUrl ?? string.Empty,
                ImageKey = dto.ImageKey ?? string.Empty,
                Created = DateTime.UtcNow,
            };

            _repo.Add(product);
            await _repo.SaveChangesAsync();

            // SyncCategories có transaction nội bộ — gọi riêng sau SaveChanges
            if (dto.CategoryIds?.Count > 0 == true)
                await _repo.SyncCategoriesAsync(product.Id, dto.CategoryIds, ct);

            _logger.LogInformation("Product created: {Id} | {Sku} | {Name}",
                product.Id, product.Sku, product.Name);

            var createdProduct = await _repo.GetByIdWithIncludesAsync(product.Id, ct)
                ?? throw new InvalidOperationException("Failed to retrieve created product");
            return ProductMapping.MapToDto(createdProduct);
        }

        // ── Update ───────────────────────────────────────────────────────────────

        public async Task<ProductDto> UpdateAsync(
            string id,
            UpdateProductDto dto,
            CancellationToken ct = default)
        {
            // GetByIdAsync (generic, không include) đủ để update scalar fields
            var product = await _repo.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm: {id}");

            if (dto.Sku != null && dto.Sku != product.Sku)
            {
                if (await _repo.ExistsSkuAsync(dto.Sku, id, ct))
                    throw new InvalidOperationException($"SKU '{dto.Sku}' đã tồn tại");
                product.Sku = dto.Sku.Trim();
            }

            if (dto.Name != null)
            {
                product.Name = dto.Name.Trim();

                // Tự sinh slug mới khi name thay đổi, trừ khi dto.Slug được truyền tường minh
                if (dto.Slug == null)
                {
                    var autoSlug = BuildSlug(product.Name);
                    if (autoSlug != product.Slug && await _repo.ExistsSlugAsync(autoSlug, id, ct))
                        autoSlug = $"{autoSlug}-{Guid.NewGuid().ToString("N")[..6]}";
                    product.Slug = autoSlug;
                }
            }

            if (dto.Slug != null)
            {
                var newSlug = BuildSlug(dto.Slug);
                if (newSlug != product.Slug && await _repo.ExistsSlugAsync(newSlug, id, ct))
                    throw new InvalidOperationException($"Slug '{newSlug}' đã tồn tại");
                product.Slug = newSlug;
            }

            if (dto.Description != null) product.Description = dto.Description.Trim();
            if (dto.Price.HasValue) product.Price = dto.Price.Value;
            if (dto.Taxable.HasValue) product.Taxable = dto.Taxable.Value;
            if (dto.IsActive.HasValue) product.IsActive = dto.IsActive.Value;

            // "null" string = xóa brand (tránh nullable conflict qua JSON)
            if (dto.BrandId != null)
                product.BrandId = dto.BrandId == "null" ? null : dto.BrandId;

            // Thay ảnh → xóa ảnh cũ trên Cloudinary sau khi DB update thành công
            var oldImageKey = product.ImageKey;
            if (!string.IsNullOrEmpty(dto.ImageKey) && !string.Equals(dto.ImageKey, product.ImageKey, StringComparison.Ordinal))
            {
                product.ImageKey = dto.ImageKey;
                product.ImageUrl = dto.ImageUrl ?? string.Empty;
            }

            product.Updated = DateTime.UtcNow;
            _repo.Update(product);
            await _repo.SaveChangesAsync();

            // Xóa ảnh cũ sau khi DB update thành công
            if (!string.IsNullOrEmpty(oldImageKey) && !string.Equals(oldImageKey, product.ImageKey, StringComparison.Ordinal))
            {
                try
                {
                    await _cloudinary.DeleteAsync(oldImageKey);
                    _logger.LogInformation("Deleted old Cloudinary image: {Key}", oldImageKey);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete old Cloudinary image {Key}", oldImageKey);
                }
            }

            if (dto.CategoryIds != null)
                await _repo.SyncCategoriesAsync(id, dto.CategoryIds, ct);

            _logger.LogInformation("Product updated: {Id} | {Name}", product.Id, product.Name);

            var updatedProduct = await _repo.GetByIdWithIncludesAsync(id, ct)
                ?? throw new InvalidOperationException("Failed to retrieve updated product");
            return ProductMapping.MapToDto(updatedProduct);
        }

        // ── Delete ───────────────────────────────────────────────────────────────

        public async Task DeleteAsync(string id, CancellationToken ct = default)
        {
            var product = await _repo.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm: {id}");

            var imageKey = product.ImageKey;

            _repo.Delete(product);
            await _repo.SaveChangesAsync();

            // Xóa ảnh Cloudinary sau khi DB commit thành công
            // Nếu xóa Cloudinary fail, DB vẫn consistent (chỉ có ảnh orphan)
            if (!string.IsNullOrEmpty(imageKey))
            {
                try
                {
                    await _cloudinary.DeleteAsync(imageKey);
                    _logger.LogInformation("Deleted Cloudinary image: {Key}", imageKey);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete Cloudinary image {Key}, but product deleted", imageKey);
                }
            }

            _logger.LogInformation("Product deleted: {Id}", id);
        }

        // ── Toggle active ─────────────────────────────────────────────────────────

        public async Task<ProductDto> ToggleActiveAsync(string id, CancellationToken ct = default)
        {
            var product = await _repo.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm: {id}");

            product.IsActive = !product.IsActive;
            product.Updated = DateTime.UtcNow;

            _repo.Update(product);
            await _repo.SaveChangesAsync();

            _logger.LogInformation("Product toggled: {Id} → IsActive={IsActive}",
                product.Id, product.IsActive);

            var toggledProduct = await _repo.GetByIdWithIncludesAsync(id, ct)
                ?? throw new InvalidOperationException("Failed to retrieve toggled product");
            return ProductMapping.MapToDto(toggledProduct);
        }

        // ── Slug builder (tiếng Việt) ─────────────────────────────────────────────

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

        private static string BuildSlug(string input)
        {
            var s = input.Trim().ToLowerInvariant();
            foreach (var kv in VietnameseMap) s = s.Replace(kv.Key, kv.Value);
            s = Regex.Replace(s, @"[^a-z0-9\s-]", "");
            s = Regex.Replace(s.Trim(), @"\s+", "-");
            return s;
        }
    }
}