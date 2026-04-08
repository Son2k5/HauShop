using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.data;
using api.services.interfaces.cloud;

namespace api.controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageController : ControllerBase
    {
        private readonly ICloudinaryService _cloudinary;
        private readonly ApplicationDbContext _db;

        public ImageController(ICloudinaryService cloudinary, ApplicationDbContext db)
        {
            _cloudinary = cloudinary;
            _db = db;
        }

        [HttpPost("upload")]
        [RequestSizeLimit(209715200)] // 200MB
        public async Task<IActionResult> Upload(List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { message = "Chưa chọn file nào." });

            var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var toUpload = new List<IFormFile>();
            var skipped = new List<string>();

            foreach (var f in files)
            {
                var ext = Path.GetExtension(f.FileName).ToLower();
                if (!allowed.Contains(ext))
                    skipped.Add(f.FileName);
                else
                    toUpload.Add(f);
            }

            if (toUpload.Count == 0)
                return BadRequest(new { message = "Không có file nào đúng định dạng ảnh.", skipped });

            // Gọi hàm UploadManyAsync đã rút gọn trong Service
            var results = await _cloudinary.UploadManyAsync(toUpload);

            var uploaded = results.Where(r => r.Success).ToList();
            var errors = results.Where(r => !r.Success)
                                .Select(r => new { r.FileName, r.Error })
                                .ToList();

            return Ok(new
            {
                total = files.Count,
                uploaded_count = uploaded.Count,
                uploaded, // Danh sách DTO: FileName, SubFolder, PublicId, Url
                skipped,
                errors
            });
        }

        // ════════════════════════════════════════════════════════════════
        // DELETE /api/image/delete?publicId=haushop/product/aokhoacnam1
        // ════════════════════════════════════════════════════════════════
        [HttpDelete("delete")]
        public async Task<IActionResult> Delete([FromQuery] string publicId)
        {
            if (string.IsNullOrEmpty(publicId)) return BadRequest("PublicId không được trống.");

            var success = await _cloudinary.DeleteAsync(publicId);
            if (success) return Ok(new { message = "Xóa ảnh thành công." });

            return BadRequest(new { message = "Xóa ảnh thất bại hoặc ảnh không tồn tại." });
        }

        // ════════════════════════════════════════════════════════════════
        // GET /api/image/products
        // ════════════════════════════════════════════════════════════════
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            // Lấy trực tiếp từ DB, Url đã được cập nhật khi Upload
            var products = await _db.Products
                .Where(p => p.IsActive)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Price,
                    imageurl = p.ImageUrl, // Link Cloudinary
                    imagekey = p.ImageKey  // PublicId để sau này dùng xóa hoặc sửa
                })
                .ToListAsync();

            return Ok(new { total = products.Count, products });
        }
    }
}