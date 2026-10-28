import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../../components/notification/NotificationBell";
import { getInitials } from "./adminShared";

const navItems = [
  { to: "/admin", end: true, label: "Tổng quan", icon: "mdi:view-dashboard-outline" },
  { to: "/admin/users", label: "Nhân sự", icon: "mdi:account-group-outline" },
  { to: "/admin/orders", label: "Đơn hàng", icon: "mdi:clipboard-text-outline" },
  { to: "/admin/chat", label: "Hỗ trợ trực tuyến", icon: "mdi:chat-processing-outline" },
  { to: "/admin/products", label: "Sản phẩm", icon: "mdi:cube-outline" },
  { to: "/admin/inventory", label: "Tồn kho", icon: "mdi:archive-outline" },
  { to: "/admin/media", label: "Thư viện ảnh", icon: "mdi:image-outline" },
  { to: "/admin/settings", label: "Cài đặt", icon: "mdi:cog-outline" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
    setSearchFocused(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNavItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return navItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Quản trị viên";
  const isFullBleedPage = location.pathname.startsWith("/admin/chat");

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-slate-50 pt-12 font-inter text-slate-950 sm:pt-14"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <header className="fixed inset-x-0 top-0 z-50 h-12 border-b border-sky-100/90 bg-white/90 shadow-[0_2px_16px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:h-14">
        <div className="flex h-full w-full items-center gap-3 px-3 sm:px-6 lg:px-0">
          <div className="flex items-center gap-2.5 lg:w-[250px] lg:shrink-0 lg:justify-center lg:px-5">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white text-blue-700 lg:hidden"
              aria-label="Mở trình đơn"
            >
              <Icon icon="mdi:menu" width={19} />
            </button>

            <NavLink to="/admin" className="shrink-0">
              <span
                className="block text-base font-extrabold tracking-[0.14em] text-slate-900 sm:text-[17px]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                HAUSHOP
              </span>
            </NavLink>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 lg:px-8">
            <div ref={searchRef} className="relative min-w-0 flex-1 max-w-md">
              <div className="relative flex items-center">
                <Icon
                  icon="mdi:magnify"
                  width={18}
                  className="pointer-events-none absolute left-3.5 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredNavItems[0]) {
                      navigate(filteredNavItems[0].to);
                      setSearchQuery("");
                      setSearchFocused(false);
                    }
                  }}
                  placeholder="Tìm kiếm chức năng, đơn hàng, sản phẩm..."
                  className="h-9 w-full rounded-lg border border-slate-200/90 bg-slate-50/80 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 sm:text-[13px]"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
                    aria-label="Xóa tìm kiếm"
                  >
                    <Icon icon="mdi:close" width={14} />
                  </button>
                ) : null}
              </div>

              {searchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-sky-100 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.12)]">
                  {filteredNavItems.length > 0 ? (
                    filteredNavItems.map((item) => (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => {
                          navigate(item.to);
                          setSearchQuery("");
                          setSearchFocused(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-sky-50 hover:text-blue-700 sm:text-[13px]"
                      >
                        <Icon icon={item.icon} width={17} className="text-sky-600" />
                        <span>Đi tới {item.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-500">
                      Không tìm thấy mục phù hợp
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <NotificationBell
                tone="admin"
                allLink="/admin/notifications"
                buttonClassName="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-sky-50 hover:text-blue-700"
              />

              <button
                type="button"
                className="flex min-w-0 items-center gap-2.5 rounded-full px-1.5 py-1 text-left transition hover:bg-sky-50 sm:px-2.5"
                aria-label="Thông tin người dùng"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-xs font-semibold text-white shadow-[0_6px_14px_rgba(37,99,235,0.16)] sm:h-8 sm:w-8">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(fullName)
                  )}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-[13px] font-semibold leading-tight text-slate-900">
                    {fullName}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-slate-500">
                    {user?.email}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={[
          "fixed inset-x-0 bottom-0 top-12 z-30 bg-slate-950/45 backdrop-blur-[2px] sm:top-14 lg:hidden",
          sidebarOpen ? "block" : "hidden",
        ].join(" ")}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={[
          "fixed bottom-0 left-0 top-12 z-40 flex w-[250px] flex-col border-r border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(37,99,235,0.08)] transition sm:top-14 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]"
                    : "text-slate-700 hover:bg-sky-50 hover:text-blue-700",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-lg transition",
                      isActive ? "bg-white/15 text-white" : "bg-white text-sky-600 shadow-sm group-hover:text-blue-700",
                    ].join(" ")}
                  >
                    <Icon icon={item.icon} width={18} />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sky-100/90 p-3">
          <div className="grid gap-2">
            <NavLink
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-white/90 px-4 py-2 text-center text-sm font-medium text-sky-700 transition hover:bg-sky-50"
            >
              <Icon icon="mdi:storefront-outline" width={18} />
              <span>Xem cửa hàng</span>
            </NavLink>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#ef4444,#dc2626)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-105"
            >
              <Icon icon="mdi:logout" width={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="w-full min-w-0 lg:pl-[250px]">
        <main
          className={
            isFullBleedPage
              ? "h-[calc(100vh-3rem)] w-full max-w-none min-w-0 overflow-hidden p-0 sm:h-[calc(100vh-3.5rem)]"
              : "w-full max-w-none min-w-0 px-3 py-4 sm:px-6 sm:py-5 lg:px-8"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
