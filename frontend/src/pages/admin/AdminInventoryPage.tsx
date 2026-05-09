import { Icon } from "@iconify/react";
import { useState } from "react";
import { useAdminInventory } from "../../hooks/useAdmin";
import { useDebounce } from "../../hooks/useDebounce";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPanel,
  AdminPanelHeader,
  AdminStatCard,
} from "./adminShared";

export default function AdminInventoryPage() {
  const [threshold, setThreshold] = useState(5);
  const debouncedThreshold = useDebounce(threshold, 350);
  const inventoryQuery = useAdminInventory(debouncedThreshold);
  const inventory = inventoryQuery.data;

  if (inventoryQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
          />
        ))}
      </div>
    );
  }

  if (inventoryQuery.isError || !inventory) {
    return (
      <AdminPanel className="p-6">
        <AdminEmptyState
          icon="mdi:alert-circle-outline"
          title="Không thể tải tồn kho"
          description="Kiểm tra lại hệ thống"
        />
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <label className="inline-flex w-fit items-center gap-3 rounded-xl border border-sky-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_12px_24px_rgba(37,99,235,0.08)]">
          <Icon icon="mdi:tune-variant" width={18} className="text-sky-600" />
          <span>Ngưỡng cảnh báo</span>
          <input
            type="number"
            min={0}
            value={threshold}
            onChange={(event) => setThreshold(Math.max(0, Number(event.target.value) || 0))}
            className="w-20 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-center text-slate-900 outline-none transition focus:border-blue-400"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="mdi:package-variant-closed"
          label="Tổng sản phẩm"
          value={String(inventory.totalProducts)}
          meta={`${inventory.activeProducts} đang bán`}
          accentClass="bg-blue-50 text-blue-700"
        />
        <AdminStatCard
          icon="mdi:layers-outline"
          label="Tổng biến thể"
          value={String(inventory.totalVariants)}
          meta={`${inventory.activeVariants} đang hoạt động`}
          accentClass="bg-cyan-50 text-cyan-700"
        />
        <AdminStatCard
          icon="mdi:archive-outline"
          label="Tổng tồn kho"
          value={inventory.totalStock.toLocaleString("vi-VN")}
          meta="Tồn kho khả dụng"
          accentClass="bg-sky-50 text-sky-700"
        />
        <AdminStatCard
          icon="mdi:alert-outline"
          label="Cần xử lý"
          value={String(inventory.lowStockCount + inventory.outOfStockCount)}
          meta={`${inventory.outOfStockCount} hết hàng`}
          accentClass="bg-red-50 text-red-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="grid gap-4">
          <SimpleMetric
            title="Sắp hết hàng"
            value={inventory.lowStockCount}
            total={inventory.totalProducts}
            icon="mdi:clock-fast"
          />
          <SimpleMetric
            title="Hết hàng"
            value={inventory.outOfStockCount}
            total={inventory.totalProducts}
            icon="mdi:close-circle-outline"
          />
          <SimpleMetric
            title="Biến thể hoạt động"
            value={inventory.activeVariants}
            total={inventory.totalVariants}
            icon="mdi:check-circle-outline"
          />
        </div>

        <AdminPanel>
          <AdminPanelHeader
            title="Danh sách cần xử lý"
            action={<AdminBadge className="bg-sky-100 text-sky-700">Ngưỡng {threshold}</AdminBadge>}
          />

          <div className="space-y-3 px-5 pb-6 pt-5 sm:px-6">
            {inventory.lowStockProducts.length ? (
              inventory.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <AdminBadge
                        className={
                          product.stock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }
                      >
                        {product.stock} cái
                      </AdminBadge>
                      <AdminBadge
                        className={
                          product.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {product.isActive ? "Đang bán" : "Tạm ẩn"}
                      </AdminBadge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <AdminEmptyState
                icon="mdi:package-variant-closed"
                title="Kho đang ổn định"
                description="Không có sản phẩm nào dưới ngưỡng cảnh báo hiện tại."
              />
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

function SimpleMetric({
  title,
  value,
  total,
  icon,
}: {
  title: string;
  value: number;
  total: number;
  icon: string;
}) {
  return (
    <AdminPanel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <Icon icon={icon} width={20} />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">Trên tổng {total}</p>
    </AdminPanel>
  );
}
