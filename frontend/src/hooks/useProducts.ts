import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productService } from "../services/productService";
import type {
  PagedProductDto,
  ProductQueryDto,
  ProductSummaryDto,
} from "../@types/product.type";
import { queryKeys } from "../lib/queryKeys";

export function useProducts(query: ProductQueryDto = {}) {
  const result = useQuery<PagedProductDto, Error>({
    queryKey: queryKeys.products.list(query),
    queryFn: () => productService.getAll(query),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  return {
    items: (result.data?.items ?? []) as ProductSummaryDto[],
    total: result.data?.total ?? 0,
    totalPages: result.data?.totalPages ?? 0,
    page: result.data?.page ?? query.page ?? 1,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error?.message ?? null,
    isFetching: result.isFetching,
    refetch: result.refetch,
  };
}
