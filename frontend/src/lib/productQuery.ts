import type { ProductQueryDto } from "../@types/product.type";

export function normalizeProductQuery(query: ProductQueryDto = {}): ProductQueryDto {
  return {
    ...(query.search?.trim() ? { search: query.search.trim() } : {}),
    ...(query.brandId ? { brandId: query.brandId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.minPrice != null ? { minPrice: query.minPrice } : {}),
    ...(query.maxPrice != null ? { maxPrice: query.maxPrice } : {}),
    ...(query.isActive != null ? { isActive: query.isActive } : {}),
    sortBy: query.sortBy ?? "created",
    sortOrder: query.sortOrder ?? "desc",
    page: Math.max(query.page ?? 1, 1),
    pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
    includeTotal: query.includeTotal ?? true,
  };
}
