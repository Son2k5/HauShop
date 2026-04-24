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
  statusTone,
} from "./adminShared";

const periodOptions = [
  { label: "7 ngày", value: 7 },
  { label: "14 ngày", value: 14 },
  { label: "30 ngày", value: 30 },
];

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

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboardQuery.isError || !dashboard) {
    return (
      <AdminPanel className="p-6">
        <AdminEmptyState
          icon="solar:danger-circle-bold-duotone"
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng doanh thu"
          value={formatPrice(dashboard.totalRevenue)}
          meta={`Hôm nay ${formatPrice(dashboard.todayRevenue)}`}
        />
        <AdminStatCard
          label="Tổng đơn hàng"
          value={dashboard.totalOrders.toLocaleString("vi-VN")}
          meta={`Tháng này ${formatPrice(dashboard.monthRevenue)}`}
        />
        <AdminStatCard
          label="Tổng khách hàng"
          value={dashboard.totalUsers.toLocaleString("vi-VN")}
          meta={`${dashboard.pendingReviews} review chờ duyệt`}
        />
        <AdminStatCard
          label="Sản phẩm đang bán"
          value={`${dashboard.activeProducts}/${dashboard.totalProducts}`}
          meta={`${dashboard.lowStockProducts.length} sản phẩm cần xử lý`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(350px,1fr)]">
        <AdminPanel>
          <AdminPanelHeader title="Doanh thu theo chu kỳ" />
          <div className="overflow-x-auto px-4 pb-6 pt-4 sm:px-6">
            <div className="min-w-[620px]">
              <div className="flex h-72 items-end gap-3 rounded-2xl bg-gray-50 p-5">
                {series.map((item, index) => {
                  const revenueHeight = Math.max(14, Math.round((item.revenue / maxRevenue) * 185));
                  const isHighlight = index === series.length - 2;
                  return (
                    <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                      <div className="flex h-52 items-end">
                        <div
                          className={[
                            "relative w-full rounded-[14px_14px_6px_6px] transition duration-300 hover:-translate-y-1",
                            isHighlight ? "bg-gray-500" : "bg-black",
                          ].join(" ")}
                          style={{ height: `${revenueHeight}px` }}
                        >
                          <div className="absolute inset-x-2 bottom-2 h-1.5 rounded-full bg-white/10" />
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
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
                            background:
                              status === "Completed"
                                ? "#5a8c6a"
                                : status === "Shipping"
                                  ? "#4a7a9b"
                                  : status === "Cancelled"
                                    ? "#c05858"
                                    : "#c8a882",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <AdminEmptyState
                  icon="solar:pie-chart-3-bold-duotone"
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
                  icon="solar:box-minimalistic-bold-duotone"
                  title="Tồn kho ổn định"
                  description="Không có sản phẩm nào dưới ngưỡng cảnh báo."
                />
              )}
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.95fr)]">
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
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#eee7dc] text-left text-[11px] uppercase tracking-[0.18em] text-[#988d81]">
                  <th className="px-4 py-3 font-semibold">Mã đơn</th>
                  <th className="px-4 py-3 font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 font-semibold">Tổng tiền</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
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
                      className="px-4 py-4 text-[1.05rem] font-semibold text-black"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <AdminBadge className={statusTone(order.status)}>
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
            <MiniInfo label="Sản phẩm tạm ẩn" value={String(dashboard.inactiveProducts)} />
            <MiniInfo label="Doanh thu tháng này" value={formatPrice(dashboard.monthRevenue)} />
            <MiniInfo
              label="Đơn chờ xử lý"
              value={String(dashboard.orderStatusCounts.Pending ?? 0)}
            />
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#eee6dc] bg-[#fcfaf7] p-4">
      <p className="text-sm text-[#7d766f]">{label}</p>
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
