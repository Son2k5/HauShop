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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const lastSlugRef = useRef<string | null>(null);

  const fetchProduct = useCallback(async (targetSlug: string) => {
    if (lastSlugRef.current === targetSlug) return;
    lastSlugRef.current = targetSlug;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await productService.getBySlug(targetSlug, controller.signal);

      if (controller.signal.aborted) return;

      setProduct(data);
    } catch (err: any) {
      if (controller.signal.aborted) return;

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Khong the tai san pham';

      setError(message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setError('Thieu slug san pham');
      return;
    }

    fetchProduct(slug);

    return () => {
      abortRef.current?.abort();
    };
  }, [slug, fetchProduct]);

  const refetch = useCallback(() => {
    if (!slug) return Promise.resolve();

    lastSlugRef.current = null;

    return fetchProduct(slug);
  }, [slug, fetchProduct]);

  return { product, loading, error, refetch };
};