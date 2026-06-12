import { Icon } from "@iconify/react";
import type { ReactNode } from "react";
import type { Role } from "../../@types/auth.type";

export const adminTitles: Record<string, { title: string }> = {
  "/admin": { title: "Tổng quan" },
  "/admin/users": { title: "Nhân sự" },
  "/admin/orders": { title: "Quản lý đơn hàng" },
  "/admin/notifications": { title: "Thông báo" },
  "/admin/chat": { title: "Chat hỗ trợ" },
  "/admin/products": { title: "Quản lý sản phẩm" },
  "/admin/inventory": { title: "Quản lý tồn kho" },
  "/admin/media": { title: "Cloudinary Upload" },
  "/admin/settings": { title: "Cài đặt"},
};

export const roleLabels: Record<Role, string> = {
  Admin: "Admin",
  Merchant: "Nhân viên bán hàng",
  Member: "Người dùng",
};

export const roleBadgeClass: Record<Role, string> = {
  Admin: "bg-blue-600 text-white",
  Merchant: "bg-cyan-100 text-cyan-800",
  Member: "bg-slate-100 text-slate-700",
};

export const orderStatusBadgeClass: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Processing: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  Shipping: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  PaymentSucceeded: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  OrderPlaced: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  SellerConfirmed: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  Packing: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  HandoverToCarrier: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  InTransit: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
  OutForDelivery: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  Delivered: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  DeliveryFailed: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  Cancelled: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  ReturnRequested: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  ReturnApproved: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  ReturnRejected: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  Returned: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
  Refunded: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

export const paymentStatusBadgeClass: Record<string, string> = {
  Pending: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  Failed: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  Refunded: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
};

export function getInitials(name?: string | null) {
  const source = name?.trim();
  if (!source) return "A";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatAdminDate(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
}

export function formatAdminDateTime(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

export function formatRoleLabel(role: Role) {
  return roleLabels[role] ?? role;
}

export function normalizeOrderStatusKey(status: string) {
  const compactStatus = status.trim().replace(/[\s_-]/g, "");
  const withoutBooleanPrefix =
    compactStatus.toLowerCase().startsWith("is") ? compactStatus.slice(2) : compactStatus;

  const aliases: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    shipping: "Shipping",
    paymentsucceeded: "PaymentSucceeded",
    orderplaced: "OrderPlaced",
    sellerconfirmed: "SellerConfirmed",
    packing: "Packing",
    handovertocarrier: "HandoverToCarrier",
    intransit: "InTransit",
    outfordelivery: "OutForDelivery",
    delivered: "Delivered",
    completed: "Completed",
    deliveryfailed: "DeliveryFailed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    returnrequested: "ReturnRequested",
    returnapproved: "ReturnApproved",
    returnrejected: "ReturnRejected",
    returned: "Returned",
    refunded: "Refunded",
  };

  return aliases[withoutBooleanPrefix.toLowerCase()] ?? status;
}

export function formatOrderStatusLabel(status: string) {
  const normalizedStatus = normalizeOrderStatusKey(status);
  const map: Record<string, string> = {
    Pending: "Đang chờ xử lý",
    Processing: "Đang xử lý",
    Shipping: "Đang giao",
    PaymentSucceeded: "Thanh toán thành công",
    OrderPlaced: "Đã đặt hàng",
    SellerConfirmed: "Người bán xác nhận",
    Packing: "Đang đóng gói",
    HandoverToCarrier: "Đã giao đơn vị vận chuyển",
    InTransit: "Đang vận chuyển",
    OutForDelivery: "Đang giao hàng",
    Delivered: "Giao thành công",
    Completed: "Hoàn tất",
    DeliveryFailed: "Giao thất bại",
    Cancelled: "Đã hủy",
    ReturnRequested: "Yêu cầu hoàn hàng",
    ReturnApproved: "Đã duyệt hoàn hàng",
    ReturnRejected: "Từ chối hoàn hàng",
    Returned: "Đã nhận hàng hoàn",
    Refunded: "Đã hoàn tiền",
  };
  return map[normalizedStatus] ?? status;
}

export function statusTone(status: string, kind: "order" | "payment" = "order") {
  const source = kind === "order" ? orderStatusBadgeClass : paymentStatusBadgeClass;
  const normalizedStatus = kind === "order" ? normalizeOrderStatusKey(status) : status;
  return source[normalizedStatus] ?? "bg-slate-100 text-slate-700";
}

export function AdminPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "min-w-0 rounded-[22px] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:rounded-[28px]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function AdminPanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <h3
          className="text-lg font-semibold text-slate-900 sm:text-xl"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {title}
        </h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon = "solar:box-minimalistic-bold-duotone",
}: {
  icon?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-sky-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-[0_12px_24px_rgba(14,165,233,0.12)]">
        <Icon icon={icon} width={28} />
      </div>
      <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  meta,
  icon,
  accentClass = "bg-blue-50 text-blue-700",
}: {
  icon?: string;
  label: string;
  value: string;
  meta?: string;
  accentClass?: string;
}) {
  return (
    <div className="min-w-0 rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_16px_32px_rgba(14,165,233,0.08)] sm:rounded-[26px] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className={["inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-semibold uppercase leading-5 tracking-[0.14em]", accentClass].join(" ")}>
          {label}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
            <Icon icon={icon} width={20} />
          </div>
        ) : null}
      </div>
      <p
        className="mt-4 break-words text-2xl font-semibold text-slate-900 sm:text-3xl"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {value}
      </p>
      {meta ? <p className="mt-2 text-sm text-slate-500">{meta}</p> : null}
    </div>
  );
}

export function AdminBadge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-center text-xs font-semibold leading-5 shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function AdminPrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function AdminSecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
