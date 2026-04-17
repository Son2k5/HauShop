export type PaymentMethod = 0 | 1; // 0 = COD, 1 = VNPay

export interface CreateOrderDto {
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  shippingFee: number;
  note?: string;
}

export interface OrderItemDto {
  productName: string;
  variantSku?: string | null;
  variantSize?: string | null;
  variantColor?: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface PaymentDto {
  method: string;
  status: string;
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
  status: string;
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  created: string;
  updated?: string | null;
  items: OrderItemDto[];
  payments: PaymentDto[];
}

export interface CheckoutResponseDto {
  order: OrderDto;
  requiresRedirect: boolean;
  paymentUrl?: string | null;
}
