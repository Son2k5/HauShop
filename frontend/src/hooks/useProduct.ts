import { useState, useEffect } from "react";
import { productService } from "../services/productService";
import type { ProductDto } from "../@types/product.type";

interface UseProductState {
  product: ProductDto | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useProductBySlug(slug: string | undefined) {
  const [state, setState] = useState<UseProductState>({
    product: null,
    isLoading: false,
    isError: false,
    error: null,
  });

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setState({ product: null, isLoading: true, isError: false, error: null });

    productService
      .getBySlug(slug)
      .then((data) => {
        if (!cancelled) setState({ product: data, isLoading: false, isError: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled)
          setState({ product: null, isLoading: false, isError: true, error: err.message });
      });

    return () => { cancelled = true; };
  }, [slug]);

  return state;
}

export function useProductById(id: string | undefined) {
  const [state, setState] = useState<UseProductState>({
    product: null,
    isLoading: false,
    isError: false,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setState({ product: null, isLoading: true, isError: false, error: null });

    productService
      .getById(id)
      .then((data) => {
        if (!cancelled) setState({ product: data, isLoading: false, isError: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled)
          setState({ product: null, isLoading: false, isError: true, error: err.message });
      });

    return () => { cancelled = true; };
  }, [id]);

  return state;
}