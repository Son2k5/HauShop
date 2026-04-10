
export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface Category extends CategorySummary {
  parentId: string | null;
  isActive: boolean;
  children: Category[];
}

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  minVariantPrice: number | null;
  totalStock: number | null;
  isActive: boolean;
  brandId: string | null;
  brandName: string | null;
  categories: CategorySummary[];
  created: string;
}

export interface Product extends ProductSummary {
  description: string;
  taxable: boolean;
  imageKey: string | null;
  brand: BrandSummary | null;
  variants: ProductVariantSummary[];
  updated: string | null;
}

export interface ProductVariantSummary {
  id: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductQueryParams {
  search?: string;
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sortBy?: 'created' | 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
}
