import type { ProductQueryDto } from "../@types/product.type";

export const queryKeys = {
  authMe: ["auth", "me"] as const,
  admin: {
    all: ["admin"] as const,
    dashboard: (lowStockThreshold: number, recentOrdersLimit: number) =>
      ["admin", "dashboard", lowStockThreshold, recentOrdersLimit] as const,
    users: (params: { search?: string; role?: string; page: number; pageSize: number }) =>
      ["admin", "users", params] as const,
    user: (userId: string) => ["admin", "user", userId] as const,
    orders: (params: { search?: string; status?: string; page: number; pageSize: number }) =>
      ["admin", "orders", params] as const,
    order: (orderId: string) => ["admin", "order", orderId] as const,
    inventory: (lowStockThreshold: number) =>
      ["admin", "inventory", lowStockThreshold] as const,
  },
  products: {
    all: ["products"] as const,
    lists: () => ["products", "list"] as const,
    list: (query: ProductQueryDto) => ["products", "list", query] as const,
    details: () => ["products", "detail"] as const,
    detailBySlug: (slug: string) => ["products", "detail", "slug", slug] as const,
    detailById: (id: string) => ["products", "detail", "id", id] as const,
    suggestions: (search: string) => ["products", "suggestions", search] as const,
  },
  wishlist: {
    ids: (userId: string) => ["wishlist", "ids", userId] as const,
    items: (userId: string) => ["wishlist", "items", userId] as const,
  },
  reviews: {
    product: (productId: string, page: number, pageSize: number) =>
      ["reviews", "product", productId, page, pageSize] as const,
  },
};
