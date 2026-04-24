import type { Role } from "./auth.type";

export interface LowStockProductDto {
  id: string;
  sku: string;
  name: string;
  stock: number;
  isActive: boolean;
}

export interface RecentOrderDto {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  created: string;
}

export interface AdminDashboardDto {
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingReviews: number;
  orderStatusCounts: Record<string, number>;
  lowStockProducts: LowStockProductDto[];
  recentOrders: RecentOrderDto[];
}

export interface AdminPagedResultDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUserListItemDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  role: Role;
  merchantId?: string | null;
  isOnline: boolean;
  created: string;
  lastSeen?: string | null;
}

export interface AdminUserDetailDto extends AdminUserListItemDto {
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string | null;
}

export interface AdminUpdateUserRoleDto {
  role: Role;
  merchantId?: string | null;
}

export interface AdminOrderListItemDto {
  id: string;
  userId: string;
  customerName: string;
  receiverName: string;
  receiverPhone: string;
  total: number;
  status: string;
  paymentStatus: string;
  itemCount: number;
  created: string;
  updated?: string | null;
}

export interface AdminOrderItemDto {
  productId: string;
  productVariantId?: string | null;
  productName: string;
  variantSku?: string | null;
  variantSize?: string | null;
  variantColor?: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface AdminOrderDetailDto {
  id: string;
  userId: string;
  customerName: string;
  customerEmail?: string | null;
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  created: string;
  updated?: string | null;
  items: AdminOrderItemDto[];
}

export interface AdminUpdateOrderStatusDto {
  status: "Pending" | "Processing" | "Shipping" | "Completed" | "Cancelled";
}

export interface AdminInventoryOverviewDto {
  totalProducts: number;
  activeProducts: number;
  totalVariants: number;
  activeVariants: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockProducts: LowStockProductDto[];
}
