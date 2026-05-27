import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { NotificationDto } from "../../@types/notification.type";
import { useAuth } from "../../hooks/useAuth";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../hooks/useNotifications";
import { formatNotificationDate, formatNotificationType } from "../../lib/notificationLabels";
import { ROUTES } from "../../lib/routes";

type NotificationBellProps = {
  buttonClassName?: string;
  dropdownAlign?: "left" | "right";
  tone?: "store" | "admin";
  allLink?: string;
};

export default function NotificationBell({
  buttonClassName,
  dropdownAlign = "right",
  tone = "store",
  allLink = ROUTES.NOTIFICATIONS,
}: NotificationBellProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const enabled = isAuthenticated;

  const notificationsQuery = useNotifications({ page: 1, pageSize: 8 }, enabled && open);
  const unreadQuery = useUnreadNotificationCount(undefined, enabled);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!isAuthenticated) return null;

  const unreadCount = unreadQuery.data ?? 0;
  const notifications = notificationsQuery.data?.items ?? [];
  const buttonClass =
    buttonClassName ??
    "relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-red-500";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={buttonClass}
        onClick={() => setOpen((current) => !current)}
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Icon icon="mdi:bell-outline" width={tone === "admin" ? 22 : 21} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={[
            "absolute top-full z-[90] mt-3 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border shadow-[0_22px_55px_rgba(15,23,42,0.16)]",
            dropdownAlign === "right" ? "right-0" : "left-0",
            tone === "admin" ? "border-sky-200 bg-white" : "border-gray-200 bg-white",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Thông báo</p>
              <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
            </div>
            <button
              type="button"
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate(undefined)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Đọc tất cả
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notificationsQuery.isLoading ? (
              <NotificationSkeleton />
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onClose={() => setOpen(false)}
                />
              ))
            ) : (
              <div className="px-4 py-10 text-center">
                <Icon icon="mdi:bell-off-outline" width={32} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">Chưa có thông báo</p>
                <p className="mt-1 text-xs text-slate-500">Cập nhật đơn hàng sẽ hiển thị ở đây.</p>
              </div>
            )}
          </div>

          <Link
            to={allLink}
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
          >
            Xem tất cả
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
  onClose,
}: {
  notification: NotificationDto;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const link = notification.link || ROUTES.NOTIFICATIONS;

  return (
    <Link
      to={link}
      onClick={() => {
        if (!notification.isRead) onMarkRead(notification.id);
        onClose();
      }}
      className={[
        "group grid grid-cols-[10px_minmax(0,1fr)_32px] gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50",
        notification.isRead ? "bg-white" : "bg-sky-50/60",
      ].join(" ")}
    >
      <span
        className={[
          "mt-2 h-2.5 w-2.5 rounded-full",
          notification.isRead ? "bg-slate-200" : "bg-red-500",
        ].join(" ")}
      />
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700">
          {formatNotificationType(notification.type)}
        </span>
        <span className="mt-1 block truncate text-sm font-semibold text-slate-900">
          {notification.title}
        </span>
        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">
          {notification.message}
        </span>
        <span className="mt-2 block text-[11px] text-slate-400">
          {formatNotificationDate(notification.created)}
        </span>
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete(notification.id);
        }}
        className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-80 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        aria-label="Xóa thông báo"
      >
        <Icon icon="mdi:trash-can-outline" width={17} />
      </button>
    </Link>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-[10px_minmax(0,1fr)] gap-3">
          <div className="mt-2 h-2.5 w-2.5 rounded-full bg-slate-100" />
          <div>
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-2 h-4 w-48 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-full rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
