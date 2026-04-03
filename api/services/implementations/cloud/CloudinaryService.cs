using api.DTOs.cloud;
using api.services.interfaces.cloud;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;

namespace api.services.implementations.cloud
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        // Gom tất cả vào 1 đường dẫn duy nhất
        private const string FOLDER_PATH = "haushop/product";
        private const string AVATAR_FOLDER = "haushop/avatars";

        public CloudinaryService(Cloudinary cloudinary)
        {
            _cloudinary = cloudinary;
        }

        public async Task<UploadResultDto> UploadAsync(IFormFile file)
        {
            var nameOnly = Path.GetFileNameWithoutExtension(file.FileName).ToLower();
            // PublicId cố định: haushop/product/ten-file
            var publicId = $"{FOLDER_PATH}/{nameOnly}";

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
                SubFolder = FOLDER_PATH,
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

        // ==================== AVATAR METHODS (Thêm mới) ====================

        public async Task<UploadResultDto> UploadAvatarAsync(IFormFile file, string userId)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is required");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Invalid file format. Allowed: jpg, jpeg, png, webp, gif");

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("File size must be less than 5MB");

            // Tạo publicId duy nhất cho avatar
            var timestamp = DateTime.UtcNow.Ticks;
            var publicId = $"{AVATAR_FOLDER}/{userId}_{timestamp}";

            await using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = publicId,
                Overwrite = true,
                UseFilename = true,
                UniqueFilename = true,
                Transformation = new Transformation()
                    .Width(400)
                    .Height(400)
                    .Crop("fill")
                    .Gravity("face")
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
        public async Task<bool> DeleteAvatarAsync(string publicId)
        {
            if (string.IsNullOrEmpty(publicId))
                return false;

            // Chỉ xóa nếu publicId thuộc thư mục avatars
            if (!publicId.Contains(AVATAR_FOLDER))
                return false;

            var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
            return result.Result == "ok";
        }

        public string GetDefaultAvatarUrl()
        {
            // Có thể trả về URL avatar mặc định từ Cloudinary hoặc từ local
            return "https://res.cloudinary.com/your-cloud-name/image/upload/v1/haushop/avatars/default-avatar";
        }
    }
}