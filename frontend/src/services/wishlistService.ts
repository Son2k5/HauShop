import type { ProductSummaryDto } from "../@types/product.type";
import { http } from "../lib/http";

export interface WishlistItemDto {
  id: string;
  productId: string;
  created: string;
  product: ProductSummaryDto;
}

export async function getMyWishlistApi(): Promise<WishlistItemDto[]> {
  return http.get<WishlistItemDto[]>("/wishlist/me");
}

export async function addWishlistItemApi(productId: string): Promise<WishlistItemDto> {
  return http.post<WishlistItemDto>("/wishlist/items", { productId });
}

export async function removeWishlistProductApi(productId: string): Promise<void> {
  await http.delete(`/wishlist/products/${productId}`);
}
export async function getMyWishlistProductIdsApi(): Promise<string[]> {
  const data = await http.get<string[]>("/wishlist/me/product-ids");
  return Array.isArray(data) ? data : [];
}

