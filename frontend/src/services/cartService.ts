import type { CartDto } from "../@types/product.type";
import { http } from "../lib/http";

export async function getMyCartApi(): Promise<CartDto> {
  return http.get<CartDto>("/cart/me");
}

export async function addToCartApi(productVariantId: string, quantity: number): Promise<CartDto> {
  return http.post<CartDto>("/cart/items", {
    productVariantId,
    quantity,
  });
}

export async function updateCartItemApi(cartItemId: string, quantity: number): Promise<CartDto> {
  return http.put<CartDto>(`/cart/items/${cartItemId}`, {
    quantity,
  });
}

export async function increaseCartItemApi(cartItemId: string, quantity = 1): Promise<CartDto> {
  return http.patch<CartDto>(`/cart/items/${cartItemId}/increase`, null, {
    params: { quantity },
  });
}

export async function removeCartItemApi(cartItemId: string): Promise<CartDto> {
  return http.delete<CartDto>(`/cart/items/${cartItemId}`);
}

export async function clearCartApi(): Promise<CartDto> {
  return http.delete<CartDto>("/cart/clear");
}
