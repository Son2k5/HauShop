import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminTitles, getInitials } from "./adminShared";

const navItems = [
  { to: "/admin", end: true, label: "Tổng quan", icon: "mdi:view-dashboard-outline" },
  { to: "/admin/users", label: "Nhân sự", icon: "mdi:account-group-outline" },
  { to: "/admin/orders", label: "Đơn hàng", icon: "mdi:clipboard-text-outline" },
  { to: "/admin/products", label: "Sản phẩm", icon: "mdi:cube-outline" },
  { to: "/admin/inventory", label: "Tồn kho", icon: "mdi:archive-outline" },
  { to: "/admin/media", label: "Cloudinary", icon: "mdi:image-outline" },
  { to: "/admin/settings", label: "Cài đặt", icon: "mdi:cog-outline" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const pageMeta = useMemo(
    () => adminTitles[location.pathname] ?? adminTitles["/admin"],
    [location.pathname]
  );

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Admin";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_28%,#f8fbff_58%,#eef2ff_100%)] text-slate-950">
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden",
          sidebarOpen ? "block" : "hidden",
        ].join(" ")}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col border-r border-sky-200/80 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_32%,#eef6ff_100%)] shadow-[0_24px_60px_rgba(37,99,235,0.14)] transition lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="border-b border-sky-200/80 px-5 py-5">
          <div className="flex items-center justify-center gap-3">
            <div>
              <span
                className="block text-xl font-extrabold tracking-[0.16em] text-black sm:text-2xl xl:text-[30px]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                HAUSHOP
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-sky-200/80 px-5 py-4">
          <div className="rounded-[24px] border border-sky-100 bg-white/80 p-4 shadow-[0_12px_24px_rgba(37,99,235,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]">
                {getInitials(fullName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)]"
                    : "text-slate-700 hover:bg-sky-50 hover:text-blue-700",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-xl transition",
                      isActive ? "bg-white/15 text-white" : "bg-white text-sky-600 shadow-sm group-hover:text-blue-700",
                    ].join(" ")}
                  >
                    <Icon icon={item.icon} width={20} />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sky-200/80 p-4">
          <div className="grid gap-2">
            <NavLink
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white/90 px-4 py-2.5 text-center text-sm font-medium text-sky-700 transition hover:bg-sky-50"
            >
              <Icon icon="mdi:storefront-outline" width={18} />
              <span>Xem cửa hàng</span>
            </NavLink>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ef4444,#dc2626)] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-105"
            >
              <Icon icon="mdi:logout" width={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[278px]">
        <header className="sticky top-0 z-30 border-b border-sky-200/80 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-white text-blue-700 lg:hidden"
              aria-label="Mở menu"
            >
              <Icon icon="mdi:menu" width={22} />
            </button>

            <div className="min-w-0 flex-1">
              <h1
                className="truncate text-[1.75rem] font-semibold text-slate-900"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {pageMeta.title}
              </h1>
            </div>

            
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
