import { useEffect, useState } from "react";
import type { OrderDto } from "../@types/order.type";
import { getMyOrdersApi, getMyOrderByIdApi } from "../services/orderService";

export function useMyOrders() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      const data = await getMyOrdersApi();
      setOrders(data);
    } catch (err: any) {
      setIsError(true);
      setError(err?.response?.data?.message || err?.message || "Không thể tải đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    isLoading,
    isError,
    error,
    refetch: fetchOrders,
  };
}

export function useMyOrder(orderId?: string) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      const data = await getMyOrderByIdApi(orderId);
      setOrder(data);
    } catch (err: any) {
      setIsError(true);
      setError(err?.response?.data?.message || err?.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  return {
    order,
    isLoading,
    isError,
    error,
    refetch: fetchOrder,
  };
}