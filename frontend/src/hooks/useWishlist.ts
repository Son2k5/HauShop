import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "./useAuthState";
import { queryKeys } from "../lib/queryKeys";
import {
  addWishlistItemApi,
  getMyWishlistApi,
  getMyWishlistProductIdsApi,
  removeWishlistProductApi,
} from "../services/wishlistService";

function useWishlistUser() {
  const { isAuthenticated, user } = useAuthState();
  return {
    isAuthenticated,
    userId: user?.id ?? null,
  };
}

export function useWishlistIds() {
  const { isAuthenticated, userId } = useWishlistUser();

  return useQuery({
    queryKey: userId ? queryKeys.wishlist.ids(userId) : ["wishlist", "ids", "guest"],
    queryFn: getMyWishlistProductIdsApi,
    enabled: isAuthenticated && !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useWishlistItems() {
  const { isAuthenticated, userId } = useWishlistUser();

  return useQuery({
    queryKey: userId ? queryKeys.wishlist.items(userId) : ["wishlist", "items", "guest"],
    queryFn: getMyWishlistApi,
    enabled: isAuthenticated && !!userId,
    staleTime: 60 * 1000,
  });
}

export function useWishlistProduct(productId: string) {
  const { isAuthenticated } = useWishlistUser();
  const idsQuery = useWishlistIds();

  const wished = useMemo(() => {
    if (!isAuthenticated) return false;
    return (idsQuery.data ?? []).includes(productId);
  }, [idsQuery.data, isAuthenticated, productId]);

  return {
    ...idsQuery,
    wished,
  };
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useWishlistUser();

  return useMutation({
    mutationFn: async ({ productId, wished }: { productId: string; wished: boolean }) => {
      if (!isAuthenticated || !userId) {
        throw new Error("Authentication required");
      }

      if (wished) {
        await removeWishlistProductApi(productId);
        return false;
      }

      await addWishlistItemApi(productId);
      return true;
    },
    onMutate: async ({ productId, wished }) => {
      if (!userId) return { previousIds: [] as string[] };

      const idsKey = queryKeys.wishlist.ids(userId);
      await queryClient.cancelQueries({ queryKey: idsKey });

      const previousIds = queryClient.getQueryData<string[]>(idsKey) ?? [];
      const nextIds = wished
        ? previousIds.filter((id) => id !== productId)
        : Array.from(new Set([...previousIds, productId]));

      queryClient.setQueryData(idsKey, nextIds);

      return { previousIds };
    },
    onError: (_error, _variables, context) => {
      if (!userId) return;
      queryClient.setQueryData(queryKeys.wishlist.ids(userId), context?.previousIds ?? []);
    },
    onSettled: () => {
      if (!userId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.ids(userId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.items(userId) });
    },
  });
}
