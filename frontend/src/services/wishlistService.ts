import api from "../api/apiClient";
import type { ProductSummaryDto } from "../@types/product.type";

export interface WishlistItemDto {
  id: string;
  productId: string;
  created: string;
  product: ProductSummaryDto;
}

export async function getMyWishlistApi(): Promise<WishlistItemDto[]> {
  const res = await api.get("/wishlist/me");
  return res.data;
}

export async function addWishlistItemApi(productId: string): Promise<WishlistItemDto> {
  const res = await api.post("/wishlist/items", { productId });
  return res.data;
}

export async function removeWishlistProductApi(productId: string): Promise<void> {
  await api.delete(`/wishlist/products/${productId}`);
}
export async function getMyWishlistProductIdsApi(): Promise<string[]> {
  const res = await api.get("/wishlist/me/product-ids");
  return Array.isArray(res.data) ? res.data : [];
}

