import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  LowStockProductDto,
  OrderStatusAnalyticsDto,
  RecentOrderDto,
  RevenueTrendPointDto,
  TopSellingProductDto,
} from "../../@types/admin.type";
import { useAdminDashboard } from "../../hooks/useAdmin";
import { formatPrice } from "../../utils/formatPrice";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPanel,
  formatAdminDateTime,
  formatOrderStatusLabel,
  statusTone,
} from "./adminShared";

type TrendMode = "day" | "week" | "month";

type ChartPayload = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: RevenueTrendPointDto | OrderStatusAnalyticsDto | TopSellingProductDto;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ChartPayload[];
};

type ProductAxisTickProps = {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
  products: TopSellingProductDto[];
};

const PRIMARY = "#4F46E5";
const SUCCESS = "#22C55E";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";

const trendOptions: Array<{ label: string; value: TrendMode }> = [
  { label: "Ngày", value: "day" },
  { label: "Tuần", value: "week" },
  { label: "Tháng", value: "month" },
];

const fallbackStatusMeta: Record<string, { label: string; color: string }> = {
  completed: { label: "Đơn hoàn thành", color: SUCCESS },
  processing: { label: "Đơn đang xử lý", color: PRIMARY },
  shipping: { label: "Đơn đang giao", color: WARNING },
  cancelled: { label: "Đơn bị hủy", color: DANGER },
  returned: { label: "Đơn hoàn trả", color: "#64748B" },
};

const compactNumberFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

function formatCompactCurrency(value: number) {
  if (value === 0) return "0đ";
  return `${compactNumberFormatter.format(value)}đ`;
}

function formatSignedPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function getStatusPresentation(item: OrderStatusAnalyticsDto) {
  const fallback = fallbackStatusMeta[item.key];
  return {
    label: fallback?.label ?? item.label,
    color: item.color || fallback?.color || PRIMARY,
  };
}

export default function AdminDashboardPage() {
  const [trendMode, setTrendMode] = useState<TrendMode>("day");
  const dashboardQuery = useAdminDashboard(5, 8);
  const dashboard = dashboardQuery.data;

  const trendData = useMemo<RevenueTrendPointDto[]>(() => {
    if (!dashboard) return [];
    if (trendMode === "week") return dashboard.weeklyRevenueTrend ?? [];
    if (trendMode === "month") return dashboard.monthlyRevenueTrend ?? [];
    return dashboard.dailyRevenueTrend ?? [];
  }, [dashboard, trendMode]);

  const orderStatusData = useMemo<OrderStatusAnalyticsDto[]>(() => {
    const rawItems = dashboard?.orderStatusAnalytics ?? [];
    return rawItems.map((item) => {
      const presentation = getStatusPresentation(item);
      return {
        ...item,
        label: presentation.label,
        color: presentation.color,
      };
    });
  }, [dashboard?.orderStatusAnalytics]);

  const totalStatusOrders = useMemo(
    () => orderStatusData.reduce((sum, item) => sum + item.count, 0),
    [orderStatusData]
  );

  const latestTrendPoint = trendData.at(-1);
  const activeGrowth = latestTrendPoint?.growthPercent ?? dashboard?.revenueGrowthPercent ?? 0;
  const topProducts = dashboard?.topSellingProducts ?? [];
  const lowStockProducts = dashboard?.lowStockProducts ?? [];
  const recentOrders = dashboard?.recentOrders ?? [];
  const hasConversionRate = typeof dashboard?.conversionRate === "number";

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboardQuery.isError || !dashboard) {
    return (
      <AdminPanel className="rounded-2xl p-6">
        <AdminEmptyState
          icon="mdi:alert-circle-outline"
          title="Không thể tải dashboard"
          description="Kiểm tra lại kết nối API hoặc quyền truy cập Admin."
        />
      </AdminPanel>
    );
  }

  return (
    <div className="min-w-0 space-y-5 text-slate-950">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Business Intelligence</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-slate-950 sm:text-3xl">
            Ecommerce Analytics
          </h2>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SegmentedControl value={trendMode} onChange={setTrendMode} />
          <AdminBadge className="bg-white text-slate-600 ring-1 ring-inset ring-slate-200">
            Cập nhật realtime qua API
          </AdminBadge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon="mdi:cash-multiple"
          label="Tổng doanh thu"
          value={formatPrice(dashboard.totalRevenue)}
          meta={`Hôm nay ${formatPrice(dashboard.todayRevenue)}`}
          accent="indigo"
          trend={dashboard.revenueGrowthPercent}
        />
        <MetricCard
          icon="mdi:clipboard-text-outline"
          label="Tổng đơn hàng"
          value={numberFormatter.format(dashboard.totalOrders)}
          meta={`AOV ${formatPrice(dashboard.averageOrderValue)}`}
          accent="emerald"
        />
        <MetricCard
          icon="mdi:account-group-outline"
          label="Tổng khách hàng"
          value={numberFormatter.format(dashboard.totalUsers)}
          meta={`${dashboard.returningCustomers} khách mua lại`}
          accent="sky"
        />
        <MetricCard
          icon="mdi:package-variant-closed"
          label="Tổng sản phẩm"
          value={numberFormatter.format(dashboard.totalProducts)}
          meta={`${dashboard.activeProducts} đang bán · ${dashboard.inactiveProducts} tạm ẩn`}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue Growth"
          value={formatSignedPercent(dashboard.revenueGrowthPercent)}
          description="So với tháng trước"
          tone={dashboard.revenueGrowthPercent >= 0 ? "success" : "danger"}
        />
        <KpiCard
          label="Average Order Value"
          value={formatPrice(dashboard.averageOrderValue)}
          description="Doanh thu / tổng đơn"
          tone="primary"
        />
        <KpiCard
          label="Conversion Rate"
          value={
            hasConversionRate
              ? formatSignedPercent(dashboard.conversionRate).replace("+", "")
              : "--"
          }
          description={
            hasConversionRate
              ? "Số đơn hàng / lượt truy cập"
              : "Cần tracking lượt truy cập"
          }
          tone="warning"
        />
        <KpiCard
          label="Returning Customers"
          value={formatSignedPercent(dashboard.returningCustomerRate).replace("+", "")}
          description="Tỷ lệ khách mua lại"
          tone="success"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <AnalyticsCard
          title="Doanh Thu Theo Thời Gian"
          subtitle="Area + line chart, so sánh với kỳ trước và hiển thị tăng trưởng khi hover."
          action={<GrowthPill value={activeGrowth} />}
          className="min-h-[440px]"
        >
          <RevenueTrendChart data={trendData} />
        </AnalyticsCard>

        <AnalyticsCard
          title="Phân Bổ Trạng Thái Đơn Hàng"
          subtitle="Theo dõi nhanh sức khỏe vận hành đơn hàng."
          className="min-h-[440px]"
        >
          <OrderDistributionChart data={orderStatusData} totalOrders={totalStatusOrders || dashboard.totalOrders} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Revenue vs Orders Trend"
        subtitle="Đối chiếu doanh thu với số lượng đơn để nhận diện tăng trưởng từ volume hay AOV."
        className="min-h-[420px]"
      >
        <RevenueOrdersChart data={trendData} />
      </AnalyticsCard>

      <AnalyticsCard
        title="Top 10 Sản Phẩm Bán Chạy"
        subtitle="Sắp xếp giảm dần theo số lượng bán, kèm doanh thu tạo ra."
        className="min-h-[460px]"
      >
        <TopProductsChart products={topProducts} />
      </AnalyticsCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <AnalyticsCard
          title="Sản phẩm sắp hết hàng"
          subtitle="Ưu tiên nhập hàng trước khi mất doanh thu."
        >
          <LowStockList products={lowStockProducts} />
        </AnalyticsCard>

        <AnalyticsCard
          title="Đơn hàng gần đây"
          subtitle="Giám sát vận hành và phát hiện trạng thái cần xử lý."
        >
          <RecentOrdersTable orders={recentOrders} />
        </AnalyticsCard>
      </div>
    </div>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: TrendMode;
  onChange: (value: TrendMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {trendOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "min-h-9 rounded-full px-4 text-sm font-semibold transition",
            value === option.value ? "bg-[#4F46E5] text-white shadow-sm" : "text-slate-500 hover:text-slate-950",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AnalyticsCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-950 sm:text-lg">{title}</h3>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  meta,
  accent,
  trend,
}: {
  icon: string;
  label: string;
  value: string;
  meta: string;
  accent: "indigo" | "emerald" | "sky" | "amber";
  trend?: number;
}) {
  const accentClass = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
  }[accent];

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}>
          <Icon icon={icon} width={21} />
        </span>
        {trend !== undefined ? <GrowthPill value={trend} compact /> : null}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-semibold tracking-[-0.01em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{meta}</p>
    </section>
  );
}

function KpiCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "bg-indigo-50 text-indigo-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  }[tone];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${toneClass.split(" ")[0]}`} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </section>
  );
}

function GrowthPill({ value, compact = false }: { value: number; compact?: boolean }) {
  const isPositive = value >= 0;
  const tone = isPositive ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-red-50 text-red-700 ring-red-100";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        tone,
      ].join(" ")}
    >
      <Icon icon={isPositive ? "mdi:arrow-up-right" : "mdi:arrow-down-right"} width={compact ? 14 : 16} />
      {formatSignedPercent(value)}
    </span>
  );
}

function RevenueTrendChart({ data }: { data: RevenueTrendPointDto[] }) {
  if (!data.length) {
    return (
      <AdminEmptyState
        icon="mdi:chart-areaspline"
        title="Chưa có dữ liệu doanh thu"
        description="Khi thanh toán thành công phát sinh, biểu đồ xu hướng sẽ hiển thị tại đây."
      />
    );
  }

  return (
    <div className="h-[330px] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.26} />
              <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickFormatter={(value) => formatCompactCurrency(Number(value))}
            tickLine={false}
            width={74}
          />
          <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }} />
          <Area
            dataKey="revenue"
            fill="url(#revenueGradient)"
            name="Doanh thu"
            stroke={PRIMARY}
            strokeWidth={2.5}
            type="monotone"
          />
          <Line
            dataKey="previousRevenue"
            dot={false}
            name="Kỳ trước"
            stroke="#94A3B8"
            strokeDasharray="5 5"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueOrdersChart({ data }: { data: RevenueTrendPointDto[] }) {
  if (!data.length) {
    return (
      <AdminEmptyState
        icon="mdi:chart-timeline-variant"
        title="Chưa có dữ liệu so sánh"
        description="Biểu đồ sẽ xuất hiện khi hệ thống có dữ liệu đơn hàng và thanh toán."
      />
    );
  }

  return (
    <div className="h-[340px] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 14, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickFormatter={(value) => formatCompactCurrency(Number(value))}
            tickLine={false}
            width={74}
            yAxisId="revenue"
          />
          <YAxis
            axisLine={false}
            orientation="right"
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickLine={false}
            width={42}
            yAxisId="orders"
          />
          <Tooltip content={<RevenueOrdersTooltip />} cursor={{ fill: "#F1F5F9" }} />
          <Bar
            barSize={22}
            dataKey="orders"
            fill="#CBD5E1"
            name="Số đơn"
            radius={[8, 8, 0, 0]}
            yAxisId="orders"
          />
          <Line
            dataKey="revenue"
            dot={{ r: 3, fill: PRIMARY, strokeWidth: 0 }}
            name="Doanh thu"
            stroke={PRIMARY}
            strokeWidth={2.75}
            type="monotone"
            yAxisId="revenue"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrderDistributionChart({
  data,
  totalOrders,
}: {
  data: OrderStatusAnalyticsDto[];
  totalOrders: number;
}) {
  if (!data.length) {
    return (
      <AdminEmptyState
        icon="mdi:chart-donut"
        title="Chưa có đơn hàng"
        description="Khi có đơn hàng mới, phân bổ trạng thái sẽ hiển thị tại đây."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="relative h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              cornerRadius={8}
              data={data}
              dataKey="count"
              innerRadius={68}
              nameKey="label"
              outerRadius={98}
              paddingAngle={3}
            >
              {data.map((item) => (
                <Cell key={item.key} fill={item.color} />
              ))}
            </Pie>
            <Tooltip content={<StatusTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Tổng đơn</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{numberFormatter.format(totalOrders)}</p>
        </div>
      </div>

      <div className="grid gap-2">
        {data.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate text-sm font-medium text-slate-700">{item.label}</span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-slate-950">
              {numberFormatter.format(item.count)} · {item.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProductsChart({ products }: { products: TopSellingProductDto[] }) {
  if (!products.length) {
    return (
      <AdminEmptyState
        icon="mdi:shopping-outline"
        title="Chưa có sản phẩm bán chạy"
        description="Khi đơn hàng phát sinh, top sản phẩm theo doanh thu và số lượng sẽ xuất hiện tại đây."
      />
    );
  }

  const chartHeight = Math.max(360, products.length * 58);

  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="min-w-[720px]" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={products}
            layout="vertical"
            margin={{ top: 8, right: 72, left: 10, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="name"
              interval={0}
              tick={<ProductAxisTick products={products} />}
              tickLine={false}
              type="category"
              width={250}
            />
            <Tooltip content={<TopProductTooltip />} cursor={{ fill: "#F8FAFC" }} />
            <Bar dataKey="quantitySold" fill={PRIMARY} name="Số lượng bán" radius={[0, 10, 10, 0]}>
              <LabelList
                dataKey="quantitySold"
                formatter={(value) => numberFormatter.format(Number(value ?? 0))}
                position="right"
                style={{ fill: "#334155", fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ProductAxisTick({ x = 0, y = 0, payload, products }: ProductAxisTickProps) {
  const name = payload?.value ?? "";
  const product = products.find((item) => item.name === name);
  const imageUrl = product?.imageUrl;

  return (
    <g transform={`translate(${x},${y})`}>
      {imageUrl ? (
        <image href={imageUrl} height="34" preserveAspectRatio="xMidYMid slice" width="34" x="-244" y="-18" />
      ) : (
        <rect fill="#EEF2FF" height="34" rx="9" width="34" x="-244" y="-18" />
      )}
      {!imageUrl ? (
        <text fill={PRIMARY} fontSize="15" fontWeight="700" textAnchor="middle" x="-227" y="4">
          {name.charAt(0).toUpperCase()}
        </text>
      ) : null}
      <text fill="#0F172A" fontSize="12" fontWeight="700" textAnchor="start" x="-200" y="-4">
        {truncateText(name, 28)}
      </text>
      <text fill="#64748B" fontSize="11" textAnchor="start" x="-200" y="14">
        {numberFormatter.format(product?.quantitySold ?? 0)} đã bán · {formatCompactCurrency(product?.revenue ?? 0)}
      </text>
    </g>
  );
}

function LowStockList({ products }: { products: LowStockProductDto[] }) {
  if (!products.length) {
    return (
      <AdminEmptyState
        icon="mdi:package-check"
        title="Tồn kho ổn định"
        description="Không có sản phẩm nào dưới ngưỡng cảnh báo."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {products.slice(0, 8).map((product) => {
        const isOut = product.stock <= 0;
        return (
          <div
            key={product.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{product.name}</p>
              <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">{product.sku}</p>
            </div>
            <span
              className={[
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                isOut ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              {product.stock} cái
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RecentOrdersTable({ orders }: { orders: RecentOrderDto[] }) {
  if (!orders.length) {
    return (
      <AdminEmptyState
        icon="mdi:clipboard-text-off-outline"
        title="Chưa có đơn hàng gần đây"
        description="Khi có đơn mới, danh sách vận hành sẽ hiển thị tại đây."
      />
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <th className="px-3 py-3">Mã đơn</th>
            <th className="px-3 py-3">Khách hàng</th>
            <th className="px-3 py-3 text-right">Tổng tiền</th>
            <th className="px-3 py-3 text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
              <td className="px-3 py-3 font-semibold text-slate-950">{order.id}</td>
              <td className="px-3 py-3">
                <p className="font-medium text-slate-700">{order.customerName || "Khách lẻ"}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatAdminDateTime(order.created)}</p>
              </td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-950">
                {formatPrice(order.totalAmount)}
              </td>
              <td className="px-3 py-3 text-center">
                <AdminBadge className={[statusTone(order.status), "min-w-[116px]"].join(" ")}>
                  {formatOrderStatusLabel(order.status)}
                </AdminBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as RevenueTrendPointDto | undefined;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <div className="mt-2 grid gap-1.5 text-sm">
        <TooltipRow color={PRIMARY} label="Doanh thu" value={formatPrice(point?.revenue ?? 0)} />
        <TooltipRow color="#94A3B8" label="Kỳ trước" value={formatPrice(point?.previousRevenue ?? 0)} />
        <TooltipRow color={point && point.growthPercent >= 0 ? SUCCESS : DANGER} label="Tăng trưởng" value={formatSignedPercent(point?.growthPercent ?? 0)} />
        <TooltipRow color="#0F172A" label="Số đơn" value={numberFormatter.format(point?.orders ?? 0)} />
      </div>
    </div>
  );
}

function RevenueOrdersTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as RevenueTrendPointDto | undefined;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <div className="mt-2 grid gap-1.5 text-sm">
        <TooltipRow color={PRIMARY} label="Doanh thu" value={formatPrice(point?.revenue ?? 0)} />
        <TooltipRow color="#94A3B8" label="Số đơn" value={numberFormatter.format(point?.orders ?? 0)} />
        <TooltipRow color={WARNING} label="AOV" value={formatPrice(point?.averageOrderValue ?? 0)} />
      </div>
    </div>
  );
}

function StatusTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as OrderStatusAnalyticsDto | undefined;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
      <div className="mt-2 grid gap-1.5 text-sm">
        <TooltipRow color={item.color} label="Số lượng" value={numberFormatter.format(item.count)} />
        <TooltipRow color={item.color} label="Tỷ lệ" value={`${item.percent}%`} />
      </div>
    </div>
  );
}

function TopProductTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const product = payload[0]?.payload as TopSellingProductDto | undefined;
  if (!product) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
      <p className="max-w-[260px] text-sm font-semibold text-slate-950">{product.name}</p>
      <div className="mt-2 grid gap-1.5 text-sm">
        <TooltipRow color={PRIMARY} label="Doanh thu" value={formatPrice(product.revenue)} />
        <TooltipRow color={SUCCESS} label="Số lượng bán" value={numberFormatter.format(product.quantitySold)} />
      </div>
    </div>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <div className="h-[440px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-[440px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
      <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
