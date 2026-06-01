import { Icon } from "@iconify/react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { AdminUpdateOrderStatusDto } from "../../@types/admin.type";
import { OrderStatuses } from "../../@types/enums.type";
import { useAdminOrder, useAdminOrders, useUpdateAdminOrderStatus } from "../../hooks/useAdmin";
import { useDebounce } from "../../hooks/useDebounce";
import { formatPrice } from "../../utils/formatPrice";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPanel,
  AdminPanelHeader,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminStatCard,
  formatAdminDateTime,
  formatOrderStatusLabel,
  statusTone,
} from "./adminShared";

const statuses: Array<AdminUpdateOrderStatusDto["status"] | ""> = [
  "",
  OrderStatuses.Pending,
  OrderStatuses.OrderPlaced,
  OrderStatuses.SellerConfirmed,
  OrderStatuses.Packing,
  OrderStatuses.HandoverToCarrier,
  OrderStatuses.InTransit,
  OrderStatuses.OutForDelivery,
  OrderStatuses.Delivered,
  OrderStatuses.DeliveryFailed,
  OrderStatuses.Processing,
  OrderStatuses.Shipping,
  OrderStatuses.Completed,
  OrderStatuses.Cancelled,
  OrderStatuses.ReturnRequested,
  OrderStatuses.ReturnApproved,
  OrderStatuses.ReturnRejected,
  OrderStatuses.Returned,
  OrderStatuses.Refunded,
];

const statusOptions = statuses.slice(1) as AdminUpdateOrderStatusDto["status"][];

const validTransitions: Partial<Record<AdminUpdateOrderStatusDto["status"], AdminUpdateOrderStatusDto["status"][]>> = {
  Pending: [OrderStatuses.Pending, OrderStatuses.OrderPlaced, OrderStatuses.SellerConfirmed, OrderStatuses.Cancelled],
  Processing: [OrderStatuses.Processing, OrderStatuses.SellerConfirmed, OrderStatuses.Packing, OrderStatuses.HandoverToCarrier, OrderStatuses.Cancelled],
  Shipping: [OrderStatuses.Shipping, OrderStatuses.InTransit, OrderStatuses.OutForDelivery, OrderStatuses.Delivered, OrderStatuses.DeliveryFailed, OrderStatuses.Completed],
  OrderPlaced: [OrderStatuses.OrderPlaced, OrderStatuses.SellerConfirmed, OrderStatuses.Cancelled],
  SellerConfirmed: [OrderStatuses.SellerConfirmed, OrderStatuses.Packing, OrderStatuses.Cancelled],
  Packing: [OrderStatuses.Packing, OrderStatuses.HandoverToCarrier, OrderStatuses.Cancelled],
  HandoverToCarrier: [OrderStatuses.HandoverToCarrier, OrderStatuses.InTransit, OrderStatuses.DeliveryFailed],
  InTransit: [OrderStatuses.InTransit, OrderStatuses.OutForDelivery, OrderStatuses.DeliveryFailed],
  OutForDelivery: [OrderStatuses.OutForDelivery, OrderStatuses.Delivered, OrderStatuses.DeliveryFailed],
  DeliveryFailed: [OrderStatuses.DeliveryFailed, OrderStatuses.OutForDelivery, OrderStatuses.Returned, OrderStatuses.Cancelled],
  Delivered: [OrderStatuses.Delivered, OrderStatuses.Completed, OrderStatuses.ReturnRequested],
  Completed: [OrderStatuses.Completed, OrderStatuses.ReturnRequested],
  Cancelled: [OrderStatuses.Cancelled],
  ReturnRequested: [OrderStatuses.ReturnRequested, OrderStatuses.ReturnApproved, OrderStatuses.ReturnRejected],
  ReturnRejected: [OrderStatuses.ReturnRejected, OrderStatuses.Delivered, OrderStatuses.Completed],
  ReturnApproved: [OrderStatuses.ReturnApproved, OrderStatuses.Returned],
  Returned: [OrderStatuses.Returned, OrderStatuses.Refunded],
  Refunded: [OrderStatuses.Refunded],
};

function toDateTimeInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export default function AdminOrdersPage() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminUpdateOrderStatusDto["status"] | "">("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string>();
  const [draftStatus, setDraftStatus] = useState<AdminUpdateOrderStatusDto["status"]>(OrderStatuses.Pending);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);
  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status: status || undefined,
      page,
      pageSize: 10,
    }),
    [debouncedSearch, page, status]
  );

  const ordersQuery = useAdminOrders(filters);
  const orderDetailQuery = useAdminOrder(selectedOrderId);
  const updateStatusMutation = useUpdateAdminOrderStatus();
  const orderDetail = orderDetailQuery.data;

  useEffect(() => {
    const orderId = new URLSearchParams(location.search).get("orderId");
    if (orderId) {
      setSelectedOrderId(orderId);
    }
  }, [location.search]);

  const stats = useMemo(() => {
    const items = ordersQuery.data?.items ?? [];
    return {
      pending: items.filter((item) => item.status === "Pending").length,
      shipping: items.filter((item) => item.status === "Shipping").length,
      completed: items.filter((item) => item.status === "Completed").length,
    };
  }, [ordersQuery.data?.items]);

  useEffect(() => {
    if (!orderDetail) return;
    setDraftStatus(orderDetail.status as AdminUpdateOrderStatusDto["status"]);
    setTrackingNumber(orderDetail.shipping?.trackingNumber ?? "");
    setCarrierName(orderDetail.shipping?.carrierName ?? "");
    setCurrentLocation(orderDetail.shipping?.currentLocation ?? "");
    setEstimatedDelivery(toDateTimeInputValue(orderDetail.shipping?.estimatedDelivery));
    setStatusNote("");
    setFormError(null);
  }, [orderDetail]);

  const handleUpdateStatus = async () => {
    if (!selectedOrderId || !orderDetail) {
      setFormError("Cần chọn một đơn hàng hợp lệ.");
      return;
    }

    const currentStatus = orderDetail.status as AdminUpdateOrderStatusDto["status"];
    if (!validTransitions[currentStatus]?.includes(draftStatus)) {
      setFormError(`Không thể chuyển trạng thái từ ${currentStatus} sang ${draftStatus}.`);
      return;
    }

    setFormError(null);

    try {
      await updateStatusMutation.mutateAsync({
        orderId: selectedOrderId,
        dto: {
          status: draftStatus,
          trackingNumber: trackingNumber.trim() || null,
          carrierName: carrierName.trim() || null,
          currentLocation: currentLocation.trim() || null,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : null,
          note: statusNote.trim() || null,
        },
      });
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          icon="mdi:clipboard-text-outline"
          label="Tổng đơn trong trang"
          value={String(ordersQuery.data?.items.length ?? 0)}
          meta={`Tổng kết quả ${ordersQuery.data?.total ?? 0}`}
          accentClass="bg-blue-50 text-blue-700"
        />
        <AdminStatCard
          icon="mdi:clock-outline"
          label="Đang chờ / xử lý"
          value={String(stats.pending)}
          meta="Cần theo dõi tiếp"
          accentClass="bg-red-50 text-red-700"
        />
        <AdminStatCard
          icon="mdi:truck-delivery-outline"
          label="Đang giao / hoàn tất"
          value={String(stats.shipping + stats.completed)}
          meta={`${stats.completed} đã hoàn thành`}
          accentClass="bg-cyan-50 text-cyan-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_420px]">
        <AdminPanel>
          <AdminPanelHeader title="Danh sách đơn hàng" />

          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-5 sm:flex-row sm:px-6">
            <div className="relative flex-1">
              <Icon
                icon="mdi:magnify"
                width={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  startTransition(() => {
                    setPage(1);
                    setSearch(value);
                  });
                }}
                placeholder="Tìm theo mã đơn, email, tên người nhận"
                className="w-full rounded-xl border border-sky-200 bg-slate-50 px-11 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as AdminUpdateOrderStatusDto["status"] | "");
              }}
              className="rounded-xl border border-sky-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {formatOrderStatusLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto px-2 pb-4 pt-2 sm:px-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3 font-semibold">Đơn hàng</th>
                  <th className="px-4 py-3 font-semibold">Người nhận</th>
                  <th className="px-4 py-3 font-semibold">Thanh toán</th>
                  <th className="px-4 py-3 font-semibold">Tổng tiền</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {(ordersQuery.data?.items ?? []).map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={[
                      "cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-sky-50/70",
                      selectedOrderId === order.id ? "bg-blue-50/70" : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{order.id}</p>
                      <p className="text-slate-600">{order.customerName || "Khách lẻ"}</p>
                      <p className="text-xs text-slate-400">{formatAdminDateTime(order.created)}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <p>{order.receiverName}</p>
                      <p className="text-xs text-slate-400">{order.receiverPhone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <AdminBadge className={statusTone(order.paymentStatus, "payment")}>
                        {order.paymentStatus}
                      </AdminBadge>
                    </td>
                    <td
                      className="px-4 py-4 text-[1.05rem] font-semibold text-blue-700"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <AdminBadge className={statusTone(order.status)}>
                        {formatOrderStatusLabel(order.status)}
                      </AdminBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!ordersQuery.data?.items.length ? (
              <div className="px-2 py-4">
                <AdminEmptyState
                  icon="mdi:shopping-off"
                  title="Không có đơn hàng phù hợp"
                  description="Thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái hiện tại."
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/80 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>Tổng {ordersQuery.data?.total ?? 0} đơn hàng</span>
            <div className="flex items-center gap-2">
              <AdminSecondaryButton
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="px-3 py-2"
              >
                Trước
              </AdminSecondaryButton>
              <span className="px-2 font-semibold text-slate-900">
                {page}/{ordersQuery.data?.totalPages ?? 1}
              </span>
              <AdminSecondaryButton
                type="button"
                disabled={page >= (ordersQuery.data?.totalPages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
                className="px-3 py-2"
              >
                Sau
              </AdminSecondaryButton>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader title="Chi tiết đơn" />

          <div className="px-5 pb-6 pt-5 sm:px-6">
            {!selectedOrderId ? (
              <AdminEmptyState
                icon="mdi:shopping-outline"
                title="Chọn một đơn hàng"
                description="Chi tiết giao nhận, item và thao tác cập nhật trạng thái sẽ hiển thị tại đây."
              />
            ) : orderDetailQuery.isLoading ? (
              <div className="h-72 animate-pulse rounded-[24px] bg-slate-100" />
            ) : orderDetail ? (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f0f9ff_100%)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-slate-900">{orderDetail.id}</p>
                      <p className="truncate text-sm text-slate-600">
                        {orderDetail.customerName || "Khách lẻ"} · {orderDetail.customerEmail || "Không có email"}
                      </p>
                    </div>
                    <AdminBadge className={statusTone(orderDetail.status)}>
                      {formatOrderStatusLabel(orderDetail.status)}
                    </AdminBadge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InfoCard label="Tổng tiền" value={formatPrice(orderDetail.total)} />
                    <InfoCard label="Thanh toán" value={orderDetail.paymentStatus} />
                    <InfoCard label="Tạm tính" value={formatPrice(orderDetail.subtotal)} />
                    <InfoCard label="Phí ship" value={formatPrice(orderDetail.shippingFee)} />
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-800">Người nhận</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-900">{orderDetail.receiverName}</span>
                      {" · "}
                      {orderDetail.receiverPhone}
                    </p>
                    <p>{orderDetail.addressLine}</p>
                    <p className="text-xs text-slate-400">Cập nhật lần cuối: {formatAdminDateTime(orderDetail.updated)}</p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-800">Van chuyen</p>
                  <div className="mt-3 grid gap-3 text-sm text-slate-600">
                    <InfoCard label="Don vi" value={orderDetail.shipping?.carrierName || "Chua cap nhat"} />
                    <InfoCard label="Ma van don" value={orderDetail.shipping?.trackingNumber || "Chua cap nhat"} />
                    <InfoCard label="Vi tri" value={orderDetail.shipping?.currentLocation || "Chua cap nhat"} />
                    <InfoCard label="Du kien" value={formatAdminDateTime(orderDetail.shipping?.estimatedDelivery)} />
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">Trạng thái mới</span>
                    <select
                      value={draftStatus}
                      onChange={(event) => {
                        setDraftStatus(event.target.value as AdminUpdateOrderStatusDto["status"]);
                        setFormError(null);
                      }}
                      className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                    >
                      {statusOptions
                        .filter((item) =>
                          validTransitions[
                            (orderDetail.status as AdminUpdateOrderStatusDto["status"]) ?? "Pending"
                          ]?.includes(item)
                        )
                        .map((item) => (
                          <option key={item} value={item}>
                            {formatOrderStatusLabel(item)}
                          </option>
                        ))}
                    </select>
                  </label>

                  <div className="mt-4 grid gap-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Ma van don</span>
                      <input
                        value={trackingNumber}
                        onChange={(event) => setTrackingNumber(event.target.value)}
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                        placeholder="VD: GHN123456789"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-800">Don vi van chuyen</span>
                        <input
                          value={carrierName}
                          onChange={(event) => setCarrierName(event.target.value)}
                          className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                          placeholder="GHN, GHTK, Viettel Post..."
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-800">Du kien giao</span>
                        <input
                          type="datetime-local"
                          value={estimatedDelivery}
                          onChange={(event) => setEstimatedDelivery(event.target.value)}
                          className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Vi tri hien tai</span>
                      <input
                        value={currentLocation}
                        onChange={(event) => setCurrentLocation(event.target.value)}
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                        placeholder="Kho Ho Chi Minh, Dang giao tai Quan 1..."
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Ghi chu tracking</span>
                      <textarea
                        value={statusNote}
                        onChange={(event) => setStatusNote(event.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                        placeholder="Thong tin se hien trong timeline cua khach hang"
                      />
                    </label>
                  </div>

                  <div className="mt-4 rounded-[18px] bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    Rule backend: OrderPlaced {"->"} SellerConfirmed {"->"} Packing {"->"} HandoverToCarrier {"->"} InTransit {"->"} OutForDelivery {"->"} Delivered {"->"} Completed.
                  </div>

                  {formError ? (
                    <div className="mt-4 rounded-[18px] bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </div>
                  ) : null}

                  {updateStatusMutation.isSuccess ? (
                    <div className="mt-4 rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      Đã cập nhật trạng thái đơn hàng thành công.
                    </div>
                  ) : null}

                  <AdminPrimaryButton
                    type="button"
                    onClick={() => void handleUpdateStatus()}
                    disabled={updateStatusMutation.isPending}
                    className="mt-4 w-full"
                  >
                    {updateStatusMutation.isPending ? "Đang cập nhật..." : "Lưu trạng thái"}
                  </AdminPrimaryButton>
                </div>

                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-800">Sản phẩm trong đơn</p>
                  <div className="mt-4 space-y-3">
                    {orderDetail.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="rounded-[18px] border border-slate-200/70 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-xs text-slate-400">
                              {item.variantSku || "Không có SKU"} · {item.variantSize || "-"} · {item.variantColor || "-"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-700">{formatPrice(item.total)}</p>
                            <p className="text-xs text-slate-400">SL {item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <AdminEmptyState
                icon="mdi:alert-circle-outline"
                title="Không tìm thấy đơn"
                description="Bản ghi có thể đã bị thay đổi hoặc không tồn tại."
              />
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
