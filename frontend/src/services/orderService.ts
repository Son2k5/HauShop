import { http } from "../lib/http";
import type {
  CheckoutResponseDto,
  CreateOrderDto,
  OrderDto,
  PagedOrderDto,
} from "../@types/order.type";
import type { OrderStatus } from "../@types/enums.type";

export async function checkoutApi(dto: CreateOrderDto): Promise<CheckoutResponseDto> {
  return http.post<CheckoutResponseDto>("/order/checkout", dto);
}

export async function getMyOrdersApi(
  page = 1,
  pageSize = 10,
  statuses?: readonly OrderStatus[]
): Promise<PagedOrderDto> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  statuses?.forEach((status) => params.append("statuses", status));

  return http.get<PagedOrderDto>("/order/my", {
    params,
  });
}

export async function getMyOrderByIdApi(orderId: string): Promise<OrderDto> {
  return http.get<OrderDto>(`/order/${orderId}`);
}

export async function cancelMyOrderApi(orderId: string): Promise<OrderDto> {
  return http.patch<OrderDto>(`/order/${orderId}/cancel`);
}

export async function completeMyOrderApi(orderId: string): Promise<OrderDto> {
  return http.patch<OrderDto>(`/order/${orderId}/complete`);
}
