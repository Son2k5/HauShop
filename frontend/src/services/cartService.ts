import api from "../api/apiClient";

export async function getMyCartApi() {
  const res = await api.get("/cart/me");
  return res.data;
}

export async function addToCartApi(productVariantId: string, quantity: number) {
  const res = await api.post("/cart/items", {
    productVariantId,
    quantity,
  });
  return res.data;
}

export async function updateCartItemApi(cartItemId: string, quantity: number) {
  const res = await api.put(`/cart/items/${cartItemId}`, {
    quantity,
  });
  return res.data;
}

export async function removeCartItemApi(cartItemId: string) {
  const res = await api.delete(`/cart/items/${cartItemId}`);
  return res.data;
}

export async function clearCartApi() {
  const res = await api.delete("/cart/clear");
  return res.data;
}
