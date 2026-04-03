using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.cloud;

namespace api.services.interfaces.cloud
{
    public interface ICloudinaryService
    {
        Task<UploadResultDto> UploadAsync(IFormFile file);
        Task<List<UploadResultDto>> UploadManyAsync(List<IFormFile> files);
        Task<bool> DeleteAsync(string publicId);
        Task<UploadResultDto> UploadAvatarAsync(IFormFile file, string userId);
        Task<bool> DeleteAvatarAsync(string publicId);
    }
}