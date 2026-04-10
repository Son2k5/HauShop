import apiClient from "../api/apiClient";
import type { ProductSummary, Product, PagedResponse, ProductQueryParams } from "../@types/product.type";
import { object, param } from "framer-motion/client";
export interface UploadResponse {
  uploaded: string[];
  errors: { fileName: string; error: string }[];
}

// Dán cứng URL Backend của bạn tại đây
const BASE_API = "https://localhost:7288";
const BASE_URL = "/product";

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

 const get = async <T>(
    url: string,
    params?: object,
    signal?: AbortSignal
  ): Promise<T> => {
    const res = await apiClient.get<T>(url, {
      ...(params ? { params } : {}),
      ...(signal ? { signal } : {}),
    });
    return res.data;
  };
export const productService = {
  getAll : async(
    params: ProductQueryParams ={},
    signal? : AbortSignal,

  ): Promise<PagedResponse<ProductSummary>> =>{
    const cleanParams = Object.fromEntries(
      //chuyen doi object thanh cap key value
      Object.entries(params).filter(
        ([_,v]) => v!== undefined && v != null && v!== ''
      )
    );
    return get<PagedResponse<ProductSummary>>(
      BASE_URL, cleanParams, signal
    );
  },

  getById: async(id: string , signal: AbortSignal) : Promise<Product> =>{
    if(!id) throw new Error("Product id is required");
    return get<Product>(`${BASE_URL}/${id}`, undefined, signal);
  },

  getBySlug: async (slug: string, signal?: AbortSignal): Promise<Product> => {
      if (!slug) throw new Error('Slug is required');
      return get<Product>(
        `${BASE_URL}/slug/${encodeURIComponent(slug)}`,
        undefined,
        signal
      );
    },
}