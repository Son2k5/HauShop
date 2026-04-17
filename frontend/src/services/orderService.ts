import api from "../api/apiClient";
import type {
  CheckoutResponseDto,
  CreateOrderDto,
  OrderDto,
} from "../@types/order.type";

export async function checkoutApi(dto: CreateOrderDto): Promise<CheckoutResponseDto> {
  const res = await api.post("/order/checkout", dto);
  return res.data;
}

export async function getMyOrdersApi(): Promise<OrderDto[]> {
  const res = await api.get("/order/my");
  return res.data;
}

export async function getMyOrderByIdApi(orderId: string): Promise<OrderDto> {
  const res = await api.get(`/order/${orderId}`);
  return res.data;
}

export async function cancelMyOrderApi(orderId: string): Promise<OrderDto> {
  const res = await api.patch(`/order/${orderId}/cancel`);
  return res.data;
}
