import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CartDto } from "../@types/product.type";
import { cachePolicy } from "../lib/cachePolicy";
import { queryKeys } from "../lib/queryKeys";
import {
  addToCartApi,
  clearCartApi,
  getMyCartApi,
  increaseCartItemApi,
  removeCartItemApi,
  updateCartItemApi,
} from "../services/cartService";

type UseCartOptions = {
  enabled?: boolean;
};

function useCartSync() {
  const queryClient = useQueryClient();

  return (cart: CartDto) => {
    queryClient.setQueryData(queryKeys.cart.me, cart);
  };
}

export function useCart(options: UseCartOptions = {}) {
  return useQuery({
    queryKey: queryKeys.cart.me,
    queryFn: getMyCartApi,
    enabled: options.enabled ?? true,
    staleTime: cachePolicy.cart.staleTime,
    gcTime: cachePolicy.cart.gcTime,
  });
}

export function useAddToCart() {
  const syncCart = useCartSync();

  return useMutation({
    mutationFn: (input: { productVariantId: string; quantity: number }) =>
      addToCartApi(input.productVariantId, input.quantity),
    onSuccess: syncCart,
  });
}

export function useUpdateCartItem() {
  const syncCart = useCartSync();

  return useMutation({
    mutationFn: (input: { cartItemId: string; quantity: number }) =>
      updateCartItemApi(input.cartItemId, input.quantity),
    onSuccess: syncCart,
  });
}

export function useIncreaseCartItem() {
  const syncCart = useCartSync();

  return useMutation({
    mutationFn: (input: { cartItemId: string; quantity?: number }) =>
      increaseCartItemApi(input.cartItemId, input.quantity ?? 1),
    onSuccess: syncCart,
  });
}

export function useRemoveCartItem() {
  const syncCart = useCartSync();

  return useMutation({
    mutationFn: removeCartItemApi,
    onSuccess: syncCart,
  });
}

export function useClearCart() {
  const syncCart = useCartSync();

  return useMutation({
    mutationFn: clearCartApi,
    onSuccess: syncCart,
  });
}
