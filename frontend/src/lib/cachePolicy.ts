const minute = 60 * 1000;
const hour = 60 * minute;

export const cachePolicy = {
  productList: {
    staleTime: 10 * minute,
    gcTime: 30 * minute,
  },
  productDetail: {
    staleTime: 30 * minute,
    gcTime: hour,
  },
  category: {
    staleTime: hour,
    gcTime: 2 * hour,
  },
  homepage: {
    staleTime: 5 * minute,
    gcTime: 30 * minute,
  },
  cart: {
    staleTime: 2 * minute,
    gcTime: 24 * hour,
  },
  suggestions: {
    staleTime: 2 * minute,
    gcTime: 10 * minute,
  },
  auth: {
    staleTime: 5 * minute,
    gcTime: 15 * minute,
  },
  order: {
    staleTime: 30 * 1000,
    gcTime: 10 * minute,
  },
} as const;
