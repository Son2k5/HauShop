import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productService } from "../services/productService";
import type {
  PagedProductDto,
  ProductQueryDto,
  ProductSummaryDto,
} from "../@types/product.type";
import { cachePolicy } from "../lib/cachePolicy";
import { normalizeProductQuery } from "../lib/productQuery";
import { queryKeys } from "../lib/queryKeys";

export function useProducts(
  query: ProductQueryDto = {},
  options: { enabled?: boolean } = {}
) {
  const enabled = options.enabled ?? true;
  const normalizedQuery = normalizeProductQuery(query);

  const result = useQuery<PagedProductDto, Error>({
    queryKey: queryKeys.products.list(normalizedQuery),
    queryFn: ({ signal }) => productService.getAll(normalizedQuery, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cachePolicy.productList.staleTime,
    gcTime: cachePolicy.productList.gcTime,
  });

  const pageSize = result.data?.pageSize ?? normalizedQuery.pageSize ?? 20;
  const total = result.data?.total ?? 0;
  const computedTotalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

  return {
    items: (result.data?.items ?? []) as ProductSummaryDto[],
    total,
    totalPages: result.data?.totalPages ?? computedTotalPages,
    hasNextPage: result.data?.hasNextPage ?? false,
    page: result.data?.page ?? normalizedQuery.page ?? 1,
    isLoading: enabled ? result.isLoading : true,
    isError: result.isError,
    error: result.error?.message ?? null,
    isFetching: result.isFetching,
    refetch: result.refetch,
  };
}
