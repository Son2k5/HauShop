// Định nghĩa cấu trúc kết quả trả về từ Backend
export interface UploadResponse {
  uploaded: string[];
  errors: { fileName: string; error: string }[];
}

// Dán cứng URL Backend của bạn tại đây
const BASE_API = "http://localhost:5271";

/**
 * Hàm upload hàng loạt ảnh với cơ chế chia nhỏ (Batching)
 * @param files Mảng các đối tượng File cần upload
 * @param onProgress Callback để cập nhật tiến độ cho giao diện
 */
export async function uploadImages(
  files: File[], 
  onProgress?: (current: number, total: number) => void
): Promise<UploadResponse> {
  const BATCH_SIZE = 10; // Mỗi lần gửi 10 ảnh
  const results: UploadResponse = { uploaded: [], errors: [] };

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const formData = new FormData();
    
    // Key "files" phải khớp với tham số List<IFormFile> files trong ASP.NET Controller
    batch.forEach(file => {
      formData.append("files", file, file.name);
    });

    try {
      const response = await fetch(`${BASE_API}/api/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server báo lỗi: ${response.status}`);
      }

      const data: UploadResponse = await response.json();
      
      if (data.uploaded) results.uploaded.push(...data.uploaded);
      if (data.errors) results.errors.push(...data.errors);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi kết nối Server";
      batch.forEach(f => results.errors.push({ 
        fileName: f.name, 
        error: errorMessage 
      }));
    }

    // Tính toán và gửi tiến độ về Component
    onProgress?.(Math.min(i + BATCH_SIZE, files.length), files.length);
  }
  
  return results;
}