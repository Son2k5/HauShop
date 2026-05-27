import { http } from "../lib/http";
import type {
  CheckoutResponseDto,
  CreateOrderDto,
  OrderDto,
  PagedOrderDto,
} from "../@types/order.type";

export async function checkoutApi(dto: CreateOrderDto): Promise<CheckoutResponseDto> {
  return http.post<CheckoutResponseDto>("/order/checkout", dto);
}

export async function getMyOrdersApi(page = 1, pageSize = 10): Promise<PagedOrderDto> {
  return http.get<PagedOrderDto>("/order/my", {
    params: { page, pageSize },
  });
}

export async function getMyOrderByIdApi(orderId: string): Promise<OrderDto> {
  return http.get<OrderDto>(`/order/${orderId}`);
}

export async function cancelMyOrderApi(orderId: string): Promise<OrderDto> {
  return http.patch<OrderDto>(`/order/${orderId}/cancel`);
}
