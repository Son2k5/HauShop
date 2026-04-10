import { useState, useEffect, useCallback, useRef } from "react";
import { productService } from "../services/productService";
import type { PagedProductDto, ProductQueryDto, ProductSummaryDto } from "../@types/product.type";

interface UseProductsState {
  items: ProductSummaryDto[];
  total: number;
  totalPages: number;
  page: number;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

const INITIAL_STATE: UseProductsState = {
  items: [],
  total: 0,
  totalPages: 0,
  page: 1,
  isLoading: false,
  isError: false,
  error: null,
};

export function useProducts(query: ProductQueryDto = {}) {
  const [state, setState] = useState<UseProductsState>(INITIAL_STATE);
  // Giữ ref để cancel fetch cũ khi query thay đổi
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (q: ProductQueryDto) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, isLoading: true, isError: false, error: null }));

    try {
      const data: PagedProductDto = await productService.getAll(q);
      setState({
        items: data.items,
        total: data.total,
        totalPages: data.totalPages,
        page: data.page,
        isLoading: false,
        isError: false,
        error: null,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: (err as Error).message ?? "Lỗi tải sản phẩm",
      }));
    }
  }, []);

  // Re-fetch khi query thay đổi (deep compare bằng JSON stringify)
  const queryKey = JSON.stringify(query);
  useEffect(() => {
    fetch(JSON.parse(queryKey) as ProductQueryDto);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const refetch = () => fetch(query);

  return { ...state, refetch };
}