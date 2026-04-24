import { Icon } from "@iconify/react";
import type { ReactNode } from "react";
import type { Role } from "../../@types/auth.type";

export const adminTitles: Record<string, { title: string }> = {
  "/admin": { title: "Tổng quan" },
  "/admin/users": { title: "Nhân sự" },
  "/admin/orders": { title: "Quản lý đơn hàng" },
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
  Pending: "bg-amber-100 text-amber-800",
  Processing: "bg-orange-100 text-orange-800",
  Shipping: "bg-sky-100 text-sky-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-700",
};

export const paymentStatusBadgeClass: Record<string, string> = {
  Pending: "bg-slate-100 text-slate-700",
  Paid: "bg-emerald-100 text-emerald-800",
  Failed: "bg-red-100 text-red-700",
  Refunded: "bg-cyan-100 text-cyan-800",
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

export function formatOrderStatusLabel(status: string) {
  const map: Record<string, string> = {
    Pending: "Đang chờ xử lý",
    Processing: "Đang xử lý",
    Shipping: "Đang giao",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };
  return map[status] ?? status;
}

export function statusTone(status: string, kind: "order" | "payment" = "order") {
  const source = kind === "order" ? orderStatusBadgeClass : paymentStatusBadgeClass;
  return source[status] ?? "bg-slate-100 text-slate-700";
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
        "rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function AdminPanelHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h3
          className="text-xl font-semibold text-slate-900"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {title}
        </h3>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
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
    <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_32px_rgba(14,165,233,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]", accentClass].join(" ")}>
          {label}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
            <Icon icon={icon} width={20} />
          </div>
        ) : null}
      </div>
      <p
        className="mt-4 text-3xl font-semibold text-slate-900"
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
  return <span className={["inline-flex rounded-full px-3 py-1 text-xs font-medium", className].join(" ")}>{children}</span>;
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
        "inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60",
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
        "inline-flex items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
