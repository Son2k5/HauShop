import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductSummary, ProductQueryParams } from '../@types/product.type';
import { productService } from '../services/productService';

type Pagination = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const useProducts = (initialParams: ProductQueryParams = {}) => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState<ProductQueryParams>(() => ({
    page: 1,
    pageSize: 12,
    ...initialParams,
  }));

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const prevInitialParamsKeyRef = useRef<string>(JSON.stringify(initialParams));

  const fetchProducts = useCallback(async (queryParams: ProductQueryParams, signal: AbortSignal) => {
    try {
      const response = await productService.getAll(queryParams, signal);
      if (signal.aborted) return;

      setProducts(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      if (signal.aborted) return;

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải sản phẩm';

      setError(message);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, []);

  // Fetch mỗi khi params thay đổi — tạo controller mới mỗi lần
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setIsLoading(true);

    fetchProducts(params, controller.signal);

    return () => {
      controller.abort();
    };
  }, [params, fetchProducts]);

  // Sync khi initialParams thay đổi từ bên ngoài (bỏ qua lần mount đầu)
  const initialParamsKey = JSON.stringify(initialParams);
  useEffect(() => {
    if (prevInitialParamsKeyRef.current === initialParamsKey) return;
    prevInitialParamsKeyRef.current = initialParamsKey;

    setParams({
      page: 1,
      pageSize: 12,
      ...initialParams,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialParamsKey]);

  const updateParams = useCallback((newParams: Partial<ProductQueryParams>) => {
    const isFilterChange = Object.keys(newParams).some(key => key !== 'page');
    setParams(prev => ({
      ...prev,
      ...newParams,
      page: isFilterChange ? 1 : (newParams.page ?? prev.page),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const refetch = useCallback(() => {
    // Reset params object reference để trigger useEffect
    setParams(prev => ({ ...prev }));
  }, []);

  return {
    products,
    error,
    isLoading,
    isFetching,
    pagination,
    params,
    updateParams,
    goToPage,
    refetch,
  };
};