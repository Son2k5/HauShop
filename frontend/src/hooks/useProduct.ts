import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";
import type { ProductDto } from "../@types/product.type";
import { cachePolicy } from "../lib/cachePolicy";
import { queryKeys } from "../lib/queryKeys";

export function useProductBySlug(slug: string | undefined) {
  const result = useQuery<ProductDto, Error>({
    queryKey: slug ? queryKeys.products.detailBySlug(slug) : ["products", "detail", "slug", "empty"],
    queryFn: ({ signal }) => productService.getBySlug(slug!, signal),
    enabled: !!slug,
    staleTime: cachePolicy.productDetail.staleTime,
    gcTime: cachePolicy.productDetail.gcTime,
  });

  return {
    product: result.data ?? null,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error?.message ?? null,
  };
}

export function useProductById(id: string | undefined) {
  const result = useQuery<ProductDto, Error>({
    queryKey: id ? queryKeys.products.detailById(id) : ["products", "detail", "id", "empty"],
    queryFn: ({ signal }) => productService.getById(id!, signal),
    enabled: !!id,
    staleTime: cachePolicy.productDetail.staleTime,
    gcTime: cachePolicy.productDetail.gcTime,
  });

  return {
    product: result.data ?? null,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error?.message ?? null,
  };
}
