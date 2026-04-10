  import { useCallback, useEffect, useRef, useState } from 'react';
  import  type { ProductSummary, ProductQueryParams } from '../@types/product.type';                        
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

    // Track first load without causing re-renders
    const hasLoadedRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);

    const fetchProducts = useCallback(async (queryParams: ProductQueryParams) => {
      // Cancel previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // UX: show loading on first load, fetching on subsequent
      if (!hasLoadedRef.current) setIsLoading(true);
      else setIsFetching(true);

      setError(null);

      try {
        const response = await productService.getAll(queryParams, controller.signal);

        // Guard against race condition
        if (controller.signal.aborted) return;

        setProducts(response.items);
        setPagination({
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        });

        hasLoadedRef.current = true;
        return response;
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;

        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể tải sản phẩm';

        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    }, []);

    // Auto fetch on params change
    useEffect(() => {
      fetchProducts(params);

      return () => {
        abortRef.current?.abort();
      };
    }, [fetchProducts, params]);

    // Sync with initialParams changes (optional)
    useEffect(() => {
      setParams(prev => ({
        ...prev,
        ...initialParams,
        page: initialParams.page || 1,
      }));
    }, [initialParams]);

    // Update params with auto reset page on filter change
    const updateParams = useCallback((newParams: Partial<ProductQueryParams>) => {
      const isFilterChange = Object.keys(newParams).some(key => key !== 'page');

      setParams(prev => ({
        ...prev,
        ...newParams,
        // Only reset page if filter changes (not page itself)
        page: isFilterChange ? 1 : (newParams.page ?? prev.page),
      }));
    }, []);

    const goToPage = useCallback((page: number) => {
      setParams(prev => ({ ...prev, page }));
    }, []);

    const refetch = useCallback(() => {
      return fetchProducts(params);
    }, [fetchProducts, params]);

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