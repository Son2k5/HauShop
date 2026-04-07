using api.DTOs.cloud;
using api.services.interfaces.cloud;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace api.services.implementations.cloud
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        private const string PRODUCT_FOLDER = "haushop/product";
        private const string AVATAR_FOLDER = "haushop/avatars";

        public CloudinaryService(Cloudinary cloudinary)
        {
            _cloudinary = cloudinary;
        }

        // ── Product images ────────────────────────────────────────────────────

        public async Task<UploadResultDto> UploadAsync(IFormFile file)
        {
            var nameOnly = Path.GetFileNameWithoutExtension(file.FileName).ToLower();
            var publicId = $"{PRODUCT_FOLDER}/{nameOnly}";

            await using var stream = file.OpenReadStream();

            var param = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = publicId,
                Overwrite = true,
                UseFilename = true,
                UniqueFilename = false,
            };

            var result = await _cloudinary.UploadAsync(param);

            return new UploadResultDto
            {
                FileName = nameOnly,
                SubFolder = PRODUCT_FOLDER,
                PublicId = result.PublicId,
                Url = result.SecureUrl?.ToString(),
                Success = result.Error == null,
                Error = result.Error?.Message,
            };
        }

        public async Task<List<UploadResultDto>> UploadManyAsync(List<IFormFile> files)
        {
            var results = new List<UploadResultDto>();
            foreach (var file in files)
            {
                results.Add(await UploadAsync(file));
            }
            return results;
        }

        public async Task<bool> DeleteAsync(string publicId)
        {
            var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
            return result.Result == "ok";
        }

        public string GetUrl(string publicId)
        {
            return _cloudinary.Api.UrlImgUp.BuildUrl(publicId);
        }

        // ── Avatar ────────────────────────────────────────────────────────────

        /// <summary>
        /// Upload ảnh avatar cho user.
        /// Validate định dạng và kích thước file.
        /// Tự động crop về 400x400, gravity face, tối ưu chất lượng.
        /// </summary>
        public async Task<UploadResultDto> UploadAvatarAsync(IFormFile file, string userId)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is required");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Invalid file format. Allowed: jpg, jpeg, png, webp, gif");

            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("File size must be less than 5MB");

            // PublicId dùng userId + timestamp để tránh cache ảnh cũ trên CDN
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var publicId = $"{AVATAR_FOLDER}/{userId}_{timestamp}";

            await using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = publicId,
                Overwrite = true,      // false vì mỗi lần upload là publicId mới (có timestamp)
                UseFilename = true,
                UniqueFilename = false,
                Transformation = new Transformation()
                    .Width(400)
                    .Height(400)
                    .Crop("fill")
                    .Gravity("face")    // Căn khuôn mặt vào trung tâm
                    .Quality("auto")
                    .FetchFormat("auto")
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            return new UploadResultDto
            {
                FileName = file.FileName,
                SubFolder = AVATAR_FOLDER,
                PublicId = result.PublicId,
                Url = result.SecureUrl?.ToString(),
                Success = result.Error == null,
                Error = result.Error?.Message,
            };
        }

        /// <summary>
        /// Xóa ảnh avatar trên Cloudinary theo publicId.
        /// Chỉ xóa nếu publicId thuộc thư mục avatars để bảo vệ ảnh khác.
        /// </summary>
        public async Task<bool> DeleteAvatarAsync(string publicId)
        {
            if (string.IsNullOrEmpty(publicId))
                return false;

            // Bảo vệ: chỉ cho phép xóa file trong thư mục avatars
            if (!publicId.StartsWith(AVATAR_FOLDER, StringComparison.OrdinalIgnoreCase))
                return false;

            var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
            return result.Result == "ok";
        }

        public string GetDefaultAvatarUrl()
        {
            return string.Empty; // Trả về empty → frontend dùng SVG fallback
        }
    }
}