using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.cloud
{
    public class UploadResultDto
    {
        public string FileName { get; set; } = "";
        public string SubFolder { get; set; } = "";
        public string PublicId { get; set; } = "";
        public string Url { get; set; } = "";
        public bool Success { get; set; }
        public string? Error { get; set; }
    }
}