import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";
import type { ProductDto } from "../@types/product.type";
import { queryKeys } from "../lib/queryKeys";

export function useProductBySlug(slug: string | undefined) {
  const result = useQuery<ProductDto, Error>({
    queryKey: slug ? queryKeys.products.detailBySlug(slug) : ["products", "detail", "slug", "empty"],
    queryFn: () => productService.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
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
    queryFn: () => productService.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    product: result.data ?? null,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error?.message ?? null,
  };
}
