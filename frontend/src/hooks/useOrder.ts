import { useQuery } from "@tanstack/react-query";
import type { OrderStatus } from "../@types/enums.type";
import type { OrderDto, PagedOrderDto } from "../@types/order.type";
import { cachePolicy } from "../lib/cachePolicy";
import { queryKeys } from "../lib/queryKeys";
import { getMyOrderByIdApi, getMyOrdersApi } from "../services/orderService";

function getErrorMessage(error: unknown, fallback: string): string {
  const maybeApiError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return maybeApiError.response?.data?.message ?? maybeApiError.message ?? fallback;
}

export function useMyOrders(page = 1, pageSize = 10, statuses?: readonly OrderStatus[]) {
  const result = useQuery<PagedOrderDto, unknown>({
    queryKey: queryKeys.orders.mine(page, pageSize, statuses),
    queryFn: () => getMyOrdersApi(page, pageSize, statuses),
    staleTime: cachePolicy.order.staleTime,
    gcTime: cachePolicy.order.gcTime,
  });

  return {
    orders: result.data?.items ?? [],
    total: result.data?.total ?? 0,
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalPages: result.data?.totalPages ?? 0,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error ? getErrorMessage(result.error, "Khong the tai don hang") : null,
    refetch: result.refetch,
  };
}

export function useMyOrder(orderId?: string) {
  const result = useQuery<OrderDto, unknown>({
    queryKey: orderId ? queryKeys.orders.detail(orderId) : ["orders", "detail", "empty"],
    queryFn: () => getMyOrderByIdApi(orderId!),
    enabled: !!orderId,
    staleTime: cachePolicy.order.staleTime,
    gcTime: cachePolicy.order.gcTime,
  });

  return {
    order: result.data ?? null,
    isLoading: !!orderId && result.isLoading,
    isError: result.isError,
    error: result.error ? getErrorMessage(result.error, "Khong the tai chi tiet don hang") : null,
    refetch: result.refetch,
  };
}
