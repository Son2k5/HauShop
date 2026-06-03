import type { CategoryDto, CategorySummaryDto } from "../@types/product.type";
import { http } from "../lib/http";

const BASE_URL = "/category";

export const categoryService = {
  getAll: (signal?: AbortSignal): Promise<CategoryDto[]> => {
    return http.get<CategoryDto[]>(BASE_URL, { signal });
  },

  getActive: (signal?: AbortSignal): Promise<CategorySummaryDto[]> => {
    return http.get<CategorySummaryDto[]>(`${BASE_URL}/active`, { signal });
  },
};
