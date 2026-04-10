//── Brand ────────────────────────────────────────────────────────────────────
export interface BrandSummaryDto {
  id: string;
  name: string;
  slug: string;
}
 
export interface BrandDto extends BrandSummaryDto {
  description: string;
  isActive: boolean;
  created: string;
  updated: string | null;
}
 
// ── Category ─────────────────────────────────────────────────────────────────
export interface CategorySummaryDto {
  id: string;
  name: string;
  slug: string;
}
 
export interface CategoryDto extends CategorySummaryDto {
  parentId: string | null;
  isActive: boolean;
  children: CategoryDto[];
}
 
// ── Product Variant ───────────────────────────────────────────────────────────
export interface ProductVariantSummaryDto {
  id: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}
 
// ── ProductSummaryDto — dùng cho list/card ────────────────────────────────────
export interface ProductSummaryDto {
  id: string;
  sku: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  minVariantPrice: number | null; // null = chưa có variant
  totalStock: number | null;
  isActive: boolean;
  brandId: string | null;
  brandName: string | null;
  categories: CategorySummaryDto[];
  created: string;

  // Tồn kho và Rating
  stock: number;
  averageRating: number;
  reviewCount: number;
}
 
// ── ProductDto — dùng cho detail page ────────────────────────────────────────
export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  taxable: boolean;
  isActive: boolean;
  imageUrl: string | null;
  imageKey: string | null;
  brandId: string | null;
  brand: BrandSummaryDto | null;
  categories: CategorySummaryDto[];
  variants: ProductVariantSummaryDto[];
  minVariantPrice: number;
  totalStock: number;
  created: string;
  updated: string | null;

  // Tồn kho và Rating
  stock: number;
  averageRating: number;
  reviewCount: number;
}
 
// ── PagedProductDto ───────────────────────────────────────────────────────────
export interface PagedProductDto {
  items: ProductSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
 
// ── Query params → GET /api/product?... ──────────────────────────────────────
export interface ProductQueryDto {
  search?: string;
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sortBy?: "created" | "price" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
 
// ── Create / Update ───────────────────────────────────────────────────────────
export interface CreateProductDto {
  sku: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  taxable?: boolean;
  isActive?: boolean;
  brandId?: string;
  categoryIds: string[];
  imageUrl?: string;
  imageKey?: string;

  // Tồn kho và Rating (optional)
  stock?: number;
  averageRating?: number;
  reviewCount?: number;
}
 
export interface UpdateProductDto {
  sku?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  taxable?: boolean;
  isActive?: boolean;
  brandId?: string;        // truyền "null" string để xóa brand
  categoryIds?: string[];
  imageUrl?: string;

  // Tồn kho và Rating (optional)
  stock?: number;
  averageRating?: number;
  reviewCount?: number;
}
// ── Cart ──────────────────────────────────────────────────────────────────────
 
/** Một dòng trong giỏ hàng */
export interface CartItem {
  product: ProductSummaryDto;
  qty: number;
  /** Variant id đã chọn (nếu có) */
  variantId?: string;
  variantSku?: string;
  /** Giá tại thời điểm thêm vào giỏ (snapshot) */
  unitPrice: number;
}
 
export interface CartState {
  items: CartItem[];
  /** Tổng số lượng tất cả items */
  totalQty: number;
  /** Tổng tiền chưa giảm giá */
  subtotal: number;
}
 
/** Actions CartContext expose ra ngoài */
export interface CartContextValue extends CartState {
  addItem: (
    product: ProductSummaryDto,
    qty?: number,
    variantId?: string,
    variantSku?: string,
    unitPrice?: number
  ) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQty: (productId: string, qty: number, variantId?: string) => void;
  clearCart: () => void;
  isInCart: (productId: string, variantId?: string) => boolean;
}
 
// ── Toast ─────────────────────────────────────────────────────────────────────
 
export type ToastType = "success" | "error" | "info" | "warning";
 
export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}
 
export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}
 
// ── UI / Filter ───────────────────────────────────────────────────────────────
 
export type SortBy    = "created" | "price" | "name";
export type SortOrder = "asc" | "desc";
 
export interface FilterState {
  search: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sortBy: SortBy;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}
 
export type FilterAction =
  | { type: "SET_SEARCH";   payload: string }
  | { type: "SET_CATEGORY"; payload: string | undefined }
  | { type: "SET_BRAND";    payload: string | undefined }
  | { type: "SET_PRICE";    payload: { min?: number; max?: number } }
  | { type: "SET_SORT";     payload: { sortBy: SortBy; sortOrder: SortOrder } }
  | { type: "SET_PAGE";     payload: number }
  | { type: "RESET" };
 
/** Kết quả trả về từ useProducts hook */
export interface UseProductsResult {
  items: ProductSummaryDto[];
  total: number;
  totalPages: number;
  page: number;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}