import apiClient from "../api/apiClient";
import type   {
  PagedProductDto,
  ProductDto,
  ProductQueryDto,
  CreateProductDto,
  UpdateProductDto,
} from "../@types/product.type.ts";

export interface UploadResponse {
  uploaded: string[];
  errors: { fileName: string; error: string }[];
}

const BASE_API = "https://localhost:7288";
const BASE_URL = "/product";

export async function uploadImages(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<UploadResponse> {
  const BATCH_SIZE = 10;
  const results: UploadResponse = { uploaded: [], errors: [] };

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const formData = new FormData();

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

    onProgress?.(Math.min(i + BATCH_SIZE, files.length), files.length);
  }

  return results;
}

function getToken(): string | null {
  return localStorage.getItem("_token");
}
 
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_API}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
 
  if (!res.ok) {
    // Thử parse lỗi có cấu trúc từ FluentValidation / controller
    const body = await res.json().catch(() => null);
    const message =
      body?.errors
        ? Object.values(body.errors as Record<string, string[]>)
            .flat()
            .join("; ")
        : `HTTP ${res.status}`;
    throw new Error(message);
  }
 
  // 204 No Content
  if (res.status === 204) return undefined as T;
 
  return res.json() as Promise<T>;
}
 
// ─── Build query string từ ProductQueryDto ────────────────────────────────────
 
function buildQuery(params: ProductQueryDto): string {
  const q = new URLSearchParams();
  if (params.search)     q.set("search",     params.search);
  if (params.brandId)    q.set("brandId",    params.brandId);
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.minPrice != null) q.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) q.set("maxPrice", String(params.maxPrice));
  if (params.isActive  != null) q.set("isActive", String(params.isActive));
  if (params.sortBy)     q.set("sortBy",     params.sortBy);
  if (params.sortOrder)  q.set("sortOrder",  params.sortOrder);
  if (params.page)       q.set("page",       String(params.page));
  if (params.pageSize)   q.set("pageSize",   String(params.pageSize));
  const str = q.toString();
  return str ? `?${str}` : "";
}
 
// ─── Public API ──────────────────────────────────────────────────────────────
 
export const productService = {
  /**
   * GET /api/product
   * Lấy danh sách sản phẩm có phân trang, filter, sort
   */
  getAll(query: ProductQueryDto = {}): Promise<PagedProductDto> {
    return request<PagedProductDto>(`/product${buildQuery(query)}`);
  },
 
  /**
   * GET /api/product/{id}
   */
  getById(id: string): Promise<ProductDto> {
    return request<ProductDto>(`/product/${id}`);
  },
 
  /**
   * GET /api/product/slug/{slug}
   * Dùng cho product detail page (SEO-friendly URL)
   */
  getBySlug(slug: string): Promise<ProductDto> {
    return request<ProductDto>(`/product/slug/${slug}`);
  },
 
  /**
   * POST /api/product   [Admin, Merchant]
   * Flow ảnh: 1) POST /api/image/upload → nhận imageUrl + imageKey
   *            2) Gọi hàm này với imageUrl + imageKey đã có
   */
  create(dto: CreateProductDto): Promise<ProductDto> {
    return request<ProductDto>("/product", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
 
  /**
   * PUT /api/product/{id}   [Admin, Merchant]
   * Chỉ gửi các field cần update (partial)
   * Để xóa brand: truyền brandId = "null"
   */
  update(id: string, dto: UpdateProductDto): Promise<ProductDto> {
    return request<ProductDto>(`/product/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
  },
 
  /**
   * DELETE /api/product/{id}   [Admin, Merchant]
   * Backend tự xóa ảnh Cloudinary
   */
  delete(id: string): Promise<void> {
    return request<void>(`/product/${id}`, { method: "DELETE" });
  },
 
  /**
   * PATCH /api/product/{id}/toggle-active   [Admin, Merchant]
   */
  toggleActive(id: string): Promise<ProductDto> {
    return request<ProductDto>(`/product/${id}/toggle-active`, {
      method: "PATCH",
    });
  },
};