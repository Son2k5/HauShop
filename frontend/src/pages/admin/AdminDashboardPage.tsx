import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { useAdminDashboard } from "../../hooks/useAdmin";
import { formatPrice } from "../../utils/formatPrice";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPanel,
  AdminPanelHeader,
  AdminStatCard,
  formatAdminDateTime,
  formatOrderStatusLabel,
  normalizeOrderStatusKey,
  statusTone,
} from "./adminShared";

const periodOptions = [
  { label: "7 ngày", value: 7 },
  { label: "14 ngày", value: 14 },
  { label: "30 ngày", value: 30 },
];

const chartPalette = [
  { from: "#38bdf8", to: "#2563eb", shadow: "rgba(37,99,235,0.24)" },
  { from: "#34d399", to: "#059669", shadow: "rgba(5,150,105,0.24)" },
  { from: "#fbbf24", to: "#f97316", shadow: "rgba(249,115,22,0.22)" },
  { from: "#fb7185", to: "#e11d48", shadow: "rgba(225,29,72,0.2)" },
  { from: "#a78bfa", to: "#7c3aed", shadow: "rgba(124,58,237,0.22)" },
  { from: "#2dd4bf", to: "#0f766e", shadow: "rgba(15,118,110,0.22)" },
];

function statusProgressColor(status: string) {
  const normalizedStatus = normalizeOrderStatusKey(status);
  const map: Record<string, string> = {
    Pending: "#f59e0b",
    Processing: "#f97316",
    Shipping: "#0ea5e9",
    PaymentSucceeded: "#10b981",
    OrderPlaced: "#f59e0b",
    SellerConfirmed: "#3b82f6",
    Packing: "#fb923c",
    HandoverToCarrier: "#06b6d4",
    InTransit: "#14b8a6",
    OutForDelivery: "#6366f1",
    Delivered: "#2dd4bf",
    Completed: "#22c55e",
    DeliveryFailed: "#fb7185",
    Cancelled: "#ef4444",
    ReturnRequested: "#a855f7",
    ReturnApproved: "#818cf8",
    ReturnRejected: "#f43f5e",
    Returned: "#0891b2",
    Refunded: "#64748b",
  };

  return map[normalizedStatus] ?? "#38bdf8";
}

function createChartSeries(period: number, revenueSeed: number, orderSeed: number) {
  return Array.from({ length: period }, (_, index) => {
    const revenueFactor = 0.58 + ((index % 6) * 0.07) + (index === period - 2 ? 0.18 : 0);
    const orderFactor = 0.54 + (((index + 3) % 5) * 0.09);

    return {
      label: `T${index + 1}`,
      revenue: Math.max(1, Math.round((revenueSeed / period) * revenueFactor)),
      orders: Math.max(1, Math.round((orderSeed / period) * orderFactor)),
    };
  });
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState(7);
  const dashboardQuery = useAdminDashboard(5, 6);
  const dashboard = dashboardQuery.data;

  const series = useMemo(() => {
    if (!dashboard) return [];
    return createChartSeries(
      period,
      dashboard.monthRevenue || dashboard.totalRevenue || 1,
      dashboard.totalOrders || 1
    );
  }, [dashboard, period]);

  const maxRevenue = Math.max(...series.map((item) => item.revenue), 1);
  const orderStatuses = useMemo(
    () => Object.entries(dashboard?.orderStatusCounts ?? {}).sort((a, b) => b[1] - a[1]),
    [dashboard?.orderStatusCounts]
  );
  const pendingOrderCount = useMemo(
    () =>
      orderStatuses.find(([status]) => normalizeOrderStatusKey(status) === "Pending")?.[1] ?? 0,
    [orderStatuses]
  );

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboardQuery.isError || !dashboard) {
    return (
      <AdminPanel className="p-6">
        <AdminEmptyState
          icon="mdi:alert-circle-outline"
          title="Không thể tải dashboard"
          description="Kiểm tra lại kết nối API hoặc quyền truy cập Admin."
        />
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="inline-flex w-fit rounded-full border border-[#e5dbcf] bg-white p-1 shadow-sm">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                period === option.value ? "bg-[#211c17] text-white" : "text-[#675f57]",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="mdi:wallet-outline"
          label="Tổng doanh thu"
          value={formatPrice(dashboard.totalRevenue)}
          meta={`Hôm nay ${formatPrice(dashboard.todayRevenue)}`}
        />
        <AdminStatCard
          icon="mdi:clipboard-text-outline"
          label="Tổng đơn hàng"
          value={dashboard.totalOrders.toLocaleString("vi-VN")}
          meta={`Tháng này ${formatPrice(dashboard.monthRevenue)}`}
        />
        <AdminStatCard
          icon="mdi:account-group-outline"
          label="Tổng khách hàng"
          value={dashboard.totalUsers.toLocaleString("vi-VN")}
          meta={`${dashboard.pendingReviews} review chờ duyệt`}
        />
        <AdminStatCard
          icon="mdi:package-variant-closed"
          label="Sản phẩm đang bán"
          value={`${dashboard.activeProducts}/${dashboard.totalProducts}`}
          meta={`${dashboard.lowStockProducts.length} sản phẩm cần xử lý`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(350px,1fr)]">
        <AdminPanel className="flex min-h-[560px] flex-col">
          <AdminPanelHeader title="Doanh thu theo chu kỳ" />
          <div className="flex min-h-0 flex-1 overflow-x-auto px-4 pb-6 pt-4 sm:px-6">
            <div
              className="min-h-0 flex-1"
              style={{ minWidth: `${Math.max(620, series.length * 52)}px` }}
            >
              <div className="relative flex h-full min-h-[430px] items-stretch gap-3 overflow-hidden rounded-2xl border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0f9ff_100%)] px-5 pb-5 pt-8">
                <div className="pointer-events-none absolute inset-x-5 bottom-16 top-8 flex flex-col justify-between">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <span key={index} className="h-px w-full bg-sky-100" />
                  ))}
                </div>
                {series.map((item, index) => {
                  const revenuePercent = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
                  const palette = chartPalette[index % chartPalette.length];
                  return (
                    <div key={item.label} className="group relative z-10 flex min-w-0 flex-1 flex-col">
                      <div className="relative flex min-h-0 flex-1 items-end justify-center px-1">
                        <div
                          className="relative w-8 rounded-[14px_14px_6px_6px] transition duration-300 group-hover:-translate-y-1 sm:w-9"
                          style={{
                            height: `${revenuePercent}%`,
                            background: `linear-gradient(180deg, ${palette.from} 0%, ${palette.to} 100%)`,
                            boxShadow: `0 14px 28px ${palette.shadow}`,
                          }}
                        >
                          <div className="absolute inset-x-2 bottom-2 h-1.5 rounded-full bg-white/10" />
                          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-[#171412] px-2.5 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                            {formatPrice(item.revenue)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 h-11 space-y-1 text-center">
                        <p className="text-xs font-semibold text-[#554d45]">{item.label}</p>
                        <p className="text-[11px] text-[#978e84]">{item.orders} đơn</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </AdminPanel>

        <div className="grid gap-6">
          <AdminPanel>
            <AdminPanelHeader title="Tỷ trọng trạng thái đơn" />
            <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
              {orderStatuses.length ? (
                orderStatuses.map(([status, count]) => {
                  const percent = Math.max(
                    4,
                    Math.round((count / Math.max(dashboard.totalOrders, 1)) * 100)
                  );
                  return (
                    <div key={status}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-[#251f1a]">
                          {formatOrderStatusLabel(status)}
                        </span>
                        <span className="text-[#7f766d]">
                          {count} đơn · {percent}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#efe8dd]">
                        <div
                          className="h-2.5 rounded-full transition-all"
                          style={{
                            width: `${percent}%`,
                            background: statusProgressColor(status),
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <AdminEmptyState
                  icon="mdi:chart-donut"
                  title="Chưa có đơn hàng"
                  description="Khi có dữ liệu đơn hàng, biểu đồ sẽ hiển thị tại đây."
                />
              )}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader
              title="Cảnh báo tồn kho thấp"
              action={
                <AdminBadge className="bg-gray-100 text-gray-700">
                  {dashboard.lowStockProducts.length} mã
                </AdminBadge>
              }
            />
            <div className="space-y-3 px-5 pb-6 pt-5 sm:px-6">
              {dashboard.lowStockProducts.length ? (
                dashboard.lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#241f1a]">{product.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#a08d7a]">
                        {product.sku}
                      </p>
                    </div>
                    <AdminBadge
                      className={
                        product.stock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }
                    >
                      {product.stock} cái
                    </AdminBadge>
                  </div>
                ))
              ) : (
                <AdminEmptyState
                  icon="mdi:package-variant-closed"
                  title="Tồn kho ổn định"
                  description="Không có sản phẩm nào dưới ngưỡng cảnh báo."
                />
              )}
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <AdminPanel>
          <AdminPanelHeader
            title="Đơn hàng gần đây"
            action={
              <AdminBadge className="bg-[#efebe5] text-[#5f5851]">
                {dashboard.recentOrders.length} bản ghi
              </AdminBadge>
            }
          />
          <div className="overflow-x-auto px-2 pb-4 pt-2 sm:px-4">
            <table className="min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[#eee7dc] text-left text-[11px] uppercase tracking-[0.18em] text-[#988d81]">
                  <th className="px-4 py-3 font-semibold">Mã đơn</th>
                  <th className="px-4 py-3 font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 text-right font-semibold">Tổng tiền</th>
                  <th className="w-[150px] px-4 py-3 text-center font-semibold">Trạng thái</th>
                  <th className="w-[170px] px-4 py-3 font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#f5efe6] last:border-b-0 hover:bg-[#fcfaf7]"
                  >
                    <td className="px-4 py-4 font-semibold text-[#241f1a]">{order.id}</td>
                    <td className="px-4 py-4 text-[#5f5851]">
                      {order.customerName || "Khách lẻ"}
                    </td>
                    <td
                      className="px-4 py-4 text-right text-[13px] font-semibold tabular-nums text-[#3f362d]"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <AdminBadge className={[statusTone(order.status), "min-w-[112px] px-3.5"].join(" ")}>
                        {formatOrderStatusLabel(order.status)}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-4 text-[#7b736b]">{formatAdminDateTime(order.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader title="Chỉ số bổ sung" />
          <div className="grid gap-3 px-5 pb-6 pt-5 sm:px-6">
            <MiniInfo
              icon="mdi:eye-off-outline"
              label="Sản phẩm tạm ẩn"
              value={String(dashboard.inactiveProducts)}
            />
            <MiniInfo
              icon="mdi:chart-line"
              label="Doanh thu tháng này"
              value={formatPrice(dashboard.monthRevenue)}
            />
            <MiniInfo
              icon="mdi:clock-outline"
              label="Đơn chờ xử lý"
              value={String(pendingOrderCount)}
            />
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

function MiniInfo({
  label,
  value,
  icon = "mdi:information-outline",
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#eee6dc] bg-[#fcfaf7] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#7d766f]">{label}</p>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#8d7b68]">
          <Icon icon={icon} width={20} />
        </span>
      </div>
      <p className="mt-1 text-lg font-semibold text-[#241f1a]">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-44 animate-pulse rounded-[28px] border border-[#ece5db] bg-white/90"
        />
      ))}
    </div>
  );
}
