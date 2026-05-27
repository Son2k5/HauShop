import * as signalR from "@microsoft/signalr";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationDto } from "../../@types/notification.type";
import { useToast } from "../../context/toastContext";
import { useAuth } from "../../hooks/useAuth";
import { NOTIFICATION_HUB_URL } from "../../lib/env";
import { queryKeys } from "../../lib/queryKeys";

export default function NotificationRealtimeBridge() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(NOTIFICATION_HUB_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ReceiveNotification", (notification: NotificationDto) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.mineRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });

      if (notification.orderId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(notification.orderId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.order(notification.orderId) });
      }

      showToast(`${notification.title}: ${notification.message}`, "info", 5200);
    });

    connection.on("UnreadCountChanged", (count: number) => {
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), count);
    });

    const start = async () => {
      try {
        await connection.start();
      } catch {
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      connection.off("ReceiveNotification");
      connection.off("UnreadCountChanged");
      void connection.stop();
    };
  }, [isAuthenticated, queryClient, showToast]);

  return null;
}
