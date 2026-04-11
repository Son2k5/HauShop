import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:7288";
const API = `${API_BASE}/api/cart`;

export async function getMyCartApi() {
  const res = await axios.get(`${API}/me`, {
    withCredentials: true,
  });
  return res.data;
}

export async function addToCartApi(productVariantId: string, quantity: number) {
  const res = await axios.post(
    `${API}/items`,
    {
      productVariantId,
      quantity,
    },
    {
      withCredentials: true,
    }
  );
  return res.data;
}

export async function updateCartItemApi(cartItemId: string, quantity: number) {
  const res = await axios.put(
    `${API}/items/${cartItemId}`,
    {
      quantity,
    },
    {
      withCredentials: true,
    }
  );
  return res.data;
}

export async function removeCartItemApi(cartItemId: string) {
  const res = await axios.delete(`${API}/items/${cartItemId}`, {
    withCredentials: true,
  });
  return res.data;
}

export async function clearCartApi() {
  const res = await axios.delete(`${API}/clear`, {
    withCredentials: true,
  });
  return res.data;
}