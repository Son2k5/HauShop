export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  SHOP: "/shop",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  CANCELLATIONS: "/cancellations",
  REVIEWS: "/reviews",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  ADMIN: "/admin",
  WISHLIST: "/wishlist",
} as const;

export const routeTo = {
  product: (slug: string) => `${ROUTES.SHOP}/${slug}`,
  shopSearch: (search: string) =>
    search ? `${ROUTES.SHOP}?search=${encodeURIComponent(search)}` : ROUTES.SHOP,
  order: (orderId: string) => `${ROUTES.ORDERS}/${orderId}`,
  adminSection: (section: string) => `${ROUTES.ADMIN}/${section}`,
  adminOrder: (orderId: string) => `${ROUTES.ADMIN}/orders?orderId=${encodeURIComponent(orderId)}`,
} as const;
