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
  ResizableTh,
  useResizableColumns,
} from "./adminShared";

export default function AdminInventoryPage() {
  const [threshold, setThreshold] = useState(5);
  const debouncedThreshold = useDebounce(threshold, 350);
  const inventoryQuery = useAdminInventory(debouncedThreshold);
  const inventory = inventoryQuery.data;
  const { widths, startResize } = useResizableColumns([64, 150, 320, 130, 140]);

  if (inventoryQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-lg border border-slate-200/80 bg-white"
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
        <label className="inline-flex w-full items-center gap-3 rounded-lg border border-sky-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[0_8px_20px_rgba(37,99,235,0.06)] sm:w-fit">
          <Icon icon="mdi:tune-variant" width={18} className="text-sky-600" />
          <span>Ngưỡng cảnh báo</span>
          <input
            type="number"
            min={0}
            value={threshold}
            onChange={(event) => setThreshold(Math.max(0, Number(event.target.value) || 0))}
            className="w-20 rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-center text-slate-900 outline-none transition focus:border-blue-400"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng sản phẩm"
          value={String(inventory.totalProducts)}
          meta={`${inventory.activeProducts} đang bán`}
          accentClass="bg-blue-50 text-blue-700"
        />
        <AdminStatCard
          label="Tổng biến thể"
          value={String(inventory.totalVariants)}
          meta={`${inventory.activeVariants} đang hoạt động`}
          accentClass="bg-cyan-50 text-cyan-700"
        />
        <AdminStatCard
          label="Tổng tồn kho"
          value={inventory.totalStock.toLocaleString("vi-VN")}
          meta="Tồn kho khả dụng"
          accentClass="bg-sky-50 text-sky-700"
        />
        <AdminStatCard
          label="Cần xử lý"
          value={String(inventory.lowStockCount + inventory.outOfStockCount)}
          meta={`${inventory.outOfStockCount} hết hàng`}
          accentClass="bg-red-50 text-red-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="grid gap-4">
          <SimpleMetric
            title="Sắp hết hàng"
            value={inventory.lowStockCount}
            total={inventory.totalProducts}
          />
          <SimpleMetric
            title="Hết hàng"
            value={inventory.outOfStockCount}
            total={inventory.totalProducts}
          />
          <SimpleMetric
            title="Biến thể hoạt động"
            value={inventory.activeVariants}
            total={inventory.totalVariants}
          />
        </div>

        <AdminPanel>
          <AdminPanelHeader
            title="Danh sách cần xử lý"
            action={<AdminBadge className="bg-sky-100 text-sky-700">Ngưỡng {threshold}</AdminBadge>}
          />

          <div className="px-2 pb-4 pt-2 sm:px-4">
            {inventory.lowStockProducts.length ? (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse font-inter text-sm font-normal">
                  <colgroup>
                    {widths.map((w, i) => (
                      <col key={i} style={{ width: w }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                      <ResizableTh align="center" onResizeStart={startResize(0)}>
                        STT
                      </ResizableTh>
                      <ResizableTh onResizeStart={startResize(1)}>Mã sản phẩm</ResizableTh>
                      <ResizableTh onResizeStart={startResize(2)}>Tên sản phẩm</ResizableTh>
                      <ResizableTh align="center" onResizeStart={startResize(3)}>
                        Tồn kho
                      </ResizableTh>
                      <ResizableTh align="center" showDivider={false}>
                        Trạng thái
                      </ResizableTh>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.lowStockProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className="border-b border-slate-100 transition last:border-b-0 hover:bg-sky-50/60"
                      >
                        <td className="whitespace-nowrap px-3 py-3 text-center font-normal text-slate-500">
                          {index + 1}
                        </td>
                        <td
                          className="truncate whitespace-nowrap px-3 py-3 font-normal text-slate-600"
                          title={product.sku}
                        >
                          {product.sku}
                        </td>
                        <td
                          className="truncate whitespace-nowrap px-3 py-3 font-medium text-slate-800"
                          title={product.name}
                        >
                          {product.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          <AdminBadge
                            className={
                              product.stock <= 0
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {product.stock} cái
                          </AdminBadge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          <AdminBadge
                            className={
                              product.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }
                          >
                            {product.isActive ? "Đang bán" : "Tạm ẩn"}
                          </AdminBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                <AdminEmptyState
                  icon="mdi:package-variant-closed"
                  title="Kho đang ổn định"
                  description="Không có sản phẩm nào dưới ngưỡng cảnh báo hiện tại."
                />
              </div>
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
}: {
  title: string;
  value: number;
  total: number;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>
      <p className="mt-2 break-words text-2xl font-semibold tracking-[-0.01em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">Trên tổng {total}</p>
    </section>
  );
}
