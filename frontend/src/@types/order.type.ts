import type { OrderStatus, PaymentMethod, PaymentStatus } from "./enums.type";

export interface CreateOrderDto {
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  shippingFee: number;
  note?: string;
}

export interface OrderItemDto {
  id: string;
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

export interface PaymentDto {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionNo: string;
  vnpTransactionId?: string | null;
  vnpResponseCode?: string | null;
  vnpBankCode?: string | null;
  vnpPayDate?: string | null;
}

export interface OrderDto {
  id: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  created: string;
  updated?: string | null;
  items: OrderItemDto[];
  payments: PaymentDto[];
}

export interface OrderSummaryDto {
  id: string;
  total: number;
  status: OrderStatus;
  created: string;
  itemCount: number;
}

export interface PagedOrderDto {
  items: OrderSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CheckoutResponseDto {
  order: OrderDto;
  requiresRedirect: boolean;
  paymentUrl?: string | null;
}
