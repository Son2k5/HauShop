import { useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '../services/productService';
import type { Product } from '../@types/product.type';

interface UseProductReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProduct = (slug: string): UseProductReturn => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchProduct = useCallback(async (targetSlug: string) => {
    // Huy request truoc do neu co
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await productService.getBySlug(targetSlug, controller.signal);

      // Bo qua neu request da bi huy
      if (controller.signal.aborted) return;

      setProduct(data);
    } catch (err: any) {
      // Bo qua loi abort
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Khong the tai san pham';

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Thieu slug san pham');
      return;
    }

    fetchProduct(slug);

    // Cleanup: huy request khi unmount hoac slug thay doi
    return () => {
      abortRef.current?.abort();
    };
  }, [slug, fetchProduct]);

  const refetch = useCallback(() => {
    if (!slug) return Promise.resolve();
    return fetchProduct(slug);
  }, [slug, fetchProduct]);

  return { product, loading, error, refetch };
};
