import { Icon } from "@iconify/react";
import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { NotificationTypes, type NotificationType } from "../@types/enums.type";
import type { NotificationDto } from "../@types/notification.type";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";
import { formatNotificationDate, formatNotificationType } from "../lib/notificationLabels";
import { ROUTES } from "../lib/routes";

type ReadFilter = "all" | "unread" | "read";

const notificationTypes = Object.values(NotificationTypes);

export default function NotificationsPage() {
  const location = useLocation();
  const [type, setType] = useState<NotificationType | "">("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [page, setPage] = useState(1);

  const isRead = readFilter === "all" ? undefined : readFilter === "read";
  const filters = useMemo(
    () => ({
      type,
      isRead,
      page,
      pageSize: 12,
    }),
    [isRead, page, type]
  );

  const notificationsQuery = useNotifications(filters);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notificationsQuery.data?.items ?? [];
  const totalPages = Math.max(notificationsQuery.data?.totalPages ?? 1, 1);
  const ordersLink = location.pathname.startsWith("/admin") ? "/admin/orders" : ROUTES.ORDERS;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-red-500">HauShop</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Thông báo</h1>
          <p className="mt-2 text-sm text-slate-500">Theo dõi thanh toán, trạng thái đơn và hoàn hàng.</p>
        </div>
        <button
          type="button"
          disabled={markAllReadMutation.isPending}
          onClick={() => markAllReadMutation.mutate(type || undefined)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon icon="mdi:check-all" width={18} />
          Đánh dấu đã đọc
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <select
          value={type}
          onChange={(event) => {
            setPage(1);
            setType(event.target.value as NotificationType | "");
          }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-400"
        >
          <option value="">Tất cả loại</option>
          {notificationTypes.map((item) => (
            <option key={item} value={item}>
              {formatNotificationType(item)}
            </option>
          ))}
        </select>

        <select
          value={readFilter}
          onChange={(event) => {
            setPage(1);
            setReadFilter(event.target.value as ReadFilter);
          }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-400"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="unread">Chưa đọc</option>
          <option value="read">Đã đọc</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {notificationsQuery.isLoading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationListItem
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markReadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        ) : (
          <div className="px-6 py-16 text-center">
            <Icon icon="mdi:bell-off-outline" width={42} className="mx-auto text-slate-300" />
            <p className="mt-4 text-base font-semibold text-slate-900">Không có thông báo phù hợp</p>
            <p className="mt-2 text-sm text-slate-500">Thử đổi bộ lọc hoặc quay lại sau khi đơn hàng được cập nhật.</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 text-sm">
        <Link to={ordersLink} className="font-medium text-slate-600 transition hover:text-red-500">
          Xem đơn hàng
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-2 text-slate-500">
            Trang {page}/{totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationListItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: NotificationDto;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const link = notification.link || ROUTES.NOTIFICATIONS;

  return (
    <div
      className={[
        "grid gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]",
        notification.isRead ? "bg-white" : "bg-sky-50/55",
      ].join(" ")}
    >
      <Link
        to={link}
        onClick={() => {
          if (!notification.isRead) onMarkRead(notification.id);
        }}
        className="min-w-0"
      >
        <div className="flex flex-wrap items-center gap-2">
          {!notification.isRead ? <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {formatNotificationType(notification.type)}
          </span>
          <span className="text-xs text-slate-400">{formatNotificationDate(notification.created)}</span>
        </div>
        <p className="mt-2 text-base font-semibold text-slate-950">{notification.title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
      </Link>

      <div className="flex items-center gap-2 sm:justify-end">
        {!notification.isRead ? (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Icon icon="mdi:check" width={16} />
            Đã đọc
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Icon icon="mdi:trash-can-outline" width={16} />
          Xóa
        </button>
      </div>
    </div>
  );
}
