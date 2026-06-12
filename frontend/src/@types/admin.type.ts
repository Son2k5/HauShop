import type { OrderStatus, PaymentStatus, Role } from "./enums.type";
import type { OrderStatusHistoryDto, ShippingDetailDto } from "./order.type";

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
  status: OrderStatus;
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
  orderStatusCounts: Partial<Record<OrderStatus, number>>;
  lowStockProducts: LowStockProductDto[];
  recentOrders: RecentOrderDto[];
  revenueGrowthPercent: number;
  averageOrderValue: number;
  conversionRate: number | null;
  conversionRateNote?: string | null;
  returningCustomers: number;
  returningCustomerRate: number;
  dailyRevenueTrend: RevenueTrendPointDto[];
  weeklyRevenueTrend: RevenueTrendPointDto[];
  monthlyRevenueTrend: RevenueTrendPointDto[];
  orderStatusAnalytics: OrderStatusAnalyticsDto[];
  topSellingProducts: TopSellingProductDto[];
}

export interface RevenueTrendPointDto {
  label: string;
  periodStart: string;
  revenue: number;
  previousRevenue: number;
  growthPercent: number;
  orders: number;
  averageOrderValue: number;
}

export interface OrderStatusAnalyticsDto {
  key: string;
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface TopSellingProductDto {
  productId: string;
  name: string;
  imageUrl?: string | null;
  quantitySold: number;
  revenue: number;
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

export interface AdminUpdateUserDto {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  merchantId?: string | null;
}

export interface AdminOrderListItemDto {
  id: string;
  userId: string;
  customerName: string;
  receiverName: string;
  receiverPhone: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
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
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  created: string;
  updated?: string | null;
  items: AdminOrderItemDto[];
  shipping?: ShippingDetailDto | null;
  statusHistory: OrderStatusHistoryDto[];
}

export interface AdminUpdateOrderStatusDto {
  status: OrderStatus;
  trackingNumber?: string | null;
  carrierName?: string | null;
  carrierCode?: string | null;
  currentLocation?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
  note?: string | null;
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

export interface AdminUpdateVariantInventoryDto {
  variantId: string;
  stock: number;
  isActive?: boolean | null;
}

export interface AdminUpdateInventoryDto {
  stock?: number | null;
  variants: AdminUpdateVariantInventoryDto[];
}

export interface AdminSettingsDto {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  lowStockThreshold: number;
  recentOrdersLimit: number;
  enableOrderNotifications: boolean;
  enableInventoryAlerts: boolean;
  enableWeeklySummary: boolean;
  updated?: string | null;
}

export interface UpdateAdminSettingsDto {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  lowStockThreshold: number;
  recentOrdersLimit: number;
  enableOrderNotifications: boolean;
  enableInventoryAlerts: boolean;
  enableWeeklySummary: boolean;
}
