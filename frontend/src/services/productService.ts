import type {
  PagedProductDto,
  ProductDto,
  ProductQueryDto,
  CreateProductDto,
  UpdateProductDto,
} from "../@types/product.type.ts";
import { http } from "../lib/http";

export interface UploadResponse {
  uploaded: string[];
  errors: { fileName: string; error: string }[];
}

export async function uploadImages(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<UploadResponse> {
  const BATCH_SIZE = 10;
  const results: UploadResponse = { uploaded: [], errors: [] };

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const formData = new FormData();

    batch.forEach((file) => {
      formData.append("files", file, file.name);
    });

    try {
      const data = await http.post<UploadResponse>("/image/upload", formData);

      if (data.uploaded) results.uploaded.push(...data.uploaded);
      if (data.errors) results.errors.push(...data.errors);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Cannot connect to server";
      batch.forEach((file) =>
        results.errors.push({
          fileName: file.name,
          error: errorMessage,
        })
      );
    }

    onProgress?.(Math.min(i + BATCH_SIZE, files.length), files.length);
  }

  return results;
}

export const productService = {
  async getAll(query: ProductQueryDto = {}, signal?: AbortSignal): Promise<PagedProductDto> {
    return http.get<PagedProductDto>("/product", {
      params: query,
      signal,
      skipAuthRedirect: true,
    });
  },

  async getById(id: string, signal?: AbortSignal): Promise<ProductDto> {
    return http.get<ProductDto>(`/product/${id}`, {
      signal,
      skipAuthRedirect: true,
    });
  },

  async getBySlug(slug: string, signal?: AbortSignal): Promise<ProductDto> {
    return http.get<ProductDto>(`/product/slug/${slug}`, {
      signal,
      skipAuthRedirect: true,
    });
  },

  async create(dto: CreateProductDto): Promise<ProductDto> {
    return http.post<ProductDto>("/product", dto);
  },

  async update(id: string, dto: UpdateProductDto): Promise<ProductDto> {
    return http.put<ProductDto>(`/product/${id}`, dto);
  },

  async delete(id: string): Promise<void> {
    await http.delete(`/product/${id}`);
  },

  async toggleActive(id: string): Promise<ProductDto> {
    return http.patch<ProductDto>(`/product/${id}/toggle-active`);
  },
};
