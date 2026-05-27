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
    products: (params: { search?: string; isActive?: boolean; page: number; pageSize: number }) =>
      ["admin", "products", params] as const,
    product: (productId: string) => ["admin", "product", productId] as const,
    inventory: (lowStockThreshold: number) =>
      ["admin", "inventory", lowStockThreshold] as const,
    settings: () => ["admin", "settings"] as const,
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
  categories: {
    all: ["categories", "all"] as const,
    active: ["categories", "active"] as const,
  },
  cart: {
    me: ["cart", "me"] as const,
  },
  orders: {
    mineRoot: ["orders", "mine"] as const,
    mine: (page: number, pageSize: number) => ["orders", "mine", page, pageSize] as const,
    detail: (orderId: string) => ["orders", "detail", orderId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params: { type?: string; isRead?: boolean; page: number; pageSize: number }) =>
      ["notifications", "list", params] as const,
    unreadCount: (type?: string) => ["notifications", "unread-count", type ?? "all"] as const,
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
