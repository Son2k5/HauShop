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
  ResizableTh,
  formatAdminDateTime,
  formatOrderStatusLabel,
  formatPaymentStatusLabel,
  statusTone,
  useResizableColumns,
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
const PAGE_SIZE = 10;

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

  const { widths, startResize } = useResizableColumns([
    56, 120, 150, 150, 125, 145, 130, 130, 150,
  ]);

  const debouncedSearch = useDebounce(search, 350);
  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, page, status]
  );

  const ordersQuery = useAdminOrders(filters);
  const orderDetailQuery = useAdminOrder(selectedOrderId);
  const updateStatusMutation = useUpdateAdminOrderStatus();
  const orderDetail = orderDetailQuery.data;
  const orders = ordersQuery.data?.items ?? [];

  useEffect(() => {
    const orderId = new URLSearchParams(location.search).get("orderId");
    if (orderId) {
      setSelectedOrderId(orderId);
    }
  }, [location.search]);

  const stats = useMemo(() => {
    return {
      pending: orders.filter((item) => item.status === "Pending").length,
      shipping: orders.filter((item) => item.status === "Shipping").length,
      completed: orders.filter((item) => item.status === "Completed").length,
    };
  }, [orders]);

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
      setFormError(
        `Không thể chuyển trạng thái từ ${formatOrderStatusLabel(currentStatus)} sang ${formatOrderStatusLabel(draftStatus)}.`
      );
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
          label="Tổng đơn trong trang"
          value={String(ordersQuery.data?.items.length ?? 0)}
          meta={`Tổng kết quả ${ordersQuery.data?.total ?? 0}`}
          accentClass="bg-blue-50 text-blue-700"
        />
        <AdminStatCard
          label="Đang chờ / xử lý"
          value={String(stats.pending)}
          meta="Cần theo dõi tiếp"
          accentClass="bg-red-50 text-red-700"
        />
        <AdminStatCard
          label="Đang giao / hoàn tất"
          value={String(stats.shipping + stats.completed)}
          meta={`${stats.completed} đã hoàn thành`}
          accentClass="bg-cyan-50 text-cyan-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_420px]">
        <AdminPanel className="self-start">
          <AdminPanelHeader title="Danh sách đơn hàng" />

          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 sm:flex-row sm:px-6">
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
                placeholder="Tìm theo mã đơn, thư điện tử, tên người nhận"
                className="w-full rounded-lg border border-sky-200 bg-slate-50 px-11 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as AdminUpdateOrderStatusDto["status"] | "");
              }}
              className="w-full rounded-lg border border-sky-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 sm:w-auto"
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {formatOrderStatusLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto px-2 pt-2 sm:px-4">
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
                  <ResizableTh onResizeStart={startResize(1)}>Mã đơn</ResizableTh>
                  <ResizableTh onResizeStart={startResize(2)}>Khách hàng</ResizableTh>
                  <ResizableTh onResizeStart={startResize(3)}>Người nhận</ResizableTh>
                  <ResizableTh onResizeStart={startResize(4)}>Số điện thoại</ResizableTh>
                  <ResizableTh onResizeStart={startResize(5)}>Thời gian đặt</ResizableTh>
                  <ResizableTh align="center" onResizeStart={startResize(6)}>
                    Thanh toán
                  </ResizableTh>
                  <ResizableTh align="right" onResizeStart={startResize(7)}>
                    Tổng tiền
                  </ResizableTh>
                  <ResizableTh align="center" showDivider={false}>
                    Trạng thái
                  </ResizableTh>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const stt = (page - 1) * PAGE_SIZE + index + 1;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={[
                        "cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-sky-50/70",
                        selectedOrderId === order.id ? "bg-blue-50/70" : "",
                      ].join(" ")}
                    >
                      <td className="whitespace-nowrap px-3 py-3 text-center font-normal text-slate-500">
                        {stt}
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 font-medium text-slate-800"
                        title={order.id}
                      >
                        {order.id}
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 font-normal text-slate-700"
                        title={order.customerName || "Khách lẻ"}
                      >
                        {order.customerName || "Khách lẻ"}
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 font-normal text-slate-600"
                        title={order.receiverName}
                      >
                        {order.receiverName}
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 font-normal text-slate-600"
                        title={order.receiverPhone}
                      >
                        {order.receiverPhone}
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 text-xs font-normal text-slate-500"
                        title={formatAdminDateTime(order.created)}
                      >
                        {formatAdminDateTime(order.created)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <AdminBadge
                          className={[statusTone(order.paymentStatus, "payment"), "max-w-full truncate"].join(" ")}
                        >
                          {formatPaymentStatusLabel(order.paymentStatus)}
                        </AdminBadge>
                      </td>
                      <td
                        className="truncate whitespace-nowrap px-3 py-3 text-right font-inter text-[13px] font-medium tabular-nums text-slate-800"
                      >
                        {formatPrice(order.total)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <AdminBadge className={[statusTone(order.status), "max-w-full truncate"].join(" ")}>
                          {formatOrderStatusLabel(order.status)}
                        </AdminBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!orders.length ? (
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

        <div className="min-h-[520px] xl:relative xl:self-stretch">
          <AdminPanel className="flex max-h-[680px] flex-col overflow-hidden xl:absolute xl:inset-0 xl:max-h-none">
            <AdminPanelHeader title="Chi tiết đơn hàng" />

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5 sm:px-6">
            {!selectedOrderId ? (
              <AdminEmptyState
                icon="mdi:shopping-outline"
                title="Chọn một đơn hàng"
                description="Chi tiết giao nhận, sản phẩm và thao tác cập nhật trạng thái sẽ hiển thị tại đây."
              />
            ) : orderDetailQuery.isLoading ? (
              <div className="h-72 animate-pulse rounded-lg bg-slate-100" />
            ) : orderDetail ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-slate-200/80 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-slate-900">{orderDetail.id}</p>
                      <p className="truncate text-sm text-slate-600">
                        {orderDetail.customerName || "Khách lẻ"} · {orderDetail.customerEmail || "Không có thư điện tử"}
                      </p>
                    </div>
                    <AdminBadge className={statusTone(orderDetail.status)}>
                      {formatOrderStatusLabel(orderDetail.status)}
                    </AdminBadge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoCard label="Tổng tiền" value={formatPrice(orderDetail.total)} />
                    <InfoCard label="Thanh toán" value={formatPaymentStatusLabel(orderDetail.paymentStatus)} />
                    <InfoCard label="Tạm tính" value={formatPrice(orderDetail.subtotal)} />
                    <InfoCard label="Phí vận chuyển" value={formatPrice(orderDetail.shippingFee)} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-white p-5">
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

                <div className="rounded-lg border border-slate-200/80 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-800">Vận chuyển</p>
                  <div className="mt-3 grid gap-3 text-sm text-slate-600">
                    <InfoCard label="Đơn vị" value={orderDetail.shipping?.carrierName || "Chưa cập nhật"} />
                    <InfoCard label="Mã vận đơn" value={orderDetail.shipping?.trackingNumber || "Chưa cập nhật"} />
                    <InfoCard label="Vị trí" value={orderDetail.shipping?.currentLocation || "Chưa cập nhật"} />
                    <InfoCard label="Dự kiến" value={formatAdminDateTime(orderDetail.shipping?.estimatedDelivery)} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-white p-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">Trạng thái mới</span>
                    <select
                      value={draftStatus}
                      onChange={(event) => {
                        setDraftStatus(event.target.value as AdminUpdateOrderStatusDto["status"]);
                        setFormError(null);
                      }}
                      className="w-full rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
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
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Mã vận đơn</span>
                      <input
                        value={trackingNumber}
                        onChange={(event) => setTrackingNumber(event.target.value)}
                        className="w-full rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                        placeholder="VD: GHN123456789"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-800">Đơn vị vận chuyển</span>
                        <input
                          value={carrierName}
                          onChange={(event) => setCarrierName(event.target.value)}
                          className="w-full rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                          placeholder="GHN, GHTK, Viettel Post..."
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-800">Dự kiến giao</span>
                        <input
                          type="datetime-local"
                          value={estimatedDelivery}
                          onChange={(event) => setEstimatedDelivery(event.target.value)}
                          className="w-full rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Vị trí hiện tại</span>
                      <input
                        value={currentLocation}
                        onChange={(event) => setCurrentLocation(event.target.value)}
                        className="w-full rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                        placeholder="Kho Hồ Chí Minh, đang giao tại Quận 1..."
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">Ghi chú vận chuyển</span>
                      <textarea
                        value={statusNote}
                        onChange={(event) => setStatusNote(event.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                        placeholder="Thông tin sẽ hiển thị trong lịch trình đơn hàng của khách hàng"
                      />
                    </label>
                  </div>

                  {formError ? (
                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </div>
                  ) : null}

                  {updateStatusMutation.isSuccess ? (
                    <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

                <div className="rounded-lg border border-slate-200/80 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-800">Sản phẩm trong đơn</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full table-fixed border-collapse font-inter text-xs font-normal">
                      <thead>
                        <tr className="border-b border-slate-200 text-left uppercase tracking-wider text-slate-400">
                          <th className="w-36 whitespace-nowrap py-2 pr-2 font-medium">Sản phẩm</th>
                          <th className="w-24 whitespace-nowrap px-2 py-2 font-medium">Mã SP</th>
                          <th className="w-16 whitespace-nowrap px-2 py-2 text-center font-medium">Cỡ</th>
                          <th className="w-16 whitespace-nowrap px-2 py-2 text-center font-medium">Màu</th>
                          <th className="w-12 whitespace-nowrap px-2 py-2 text-center font-medium">SL</th>
                          <th className="w-24 whitespace-nowrap py-2 pl-2 text-right font-medium">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(orderDetail.items ?? []).map((item, index) => (
                          <tr key={`${item.productId}-${index}`} className="border-b border-slate-100 last:border-b-0">
                            <td className="truncate whitespace-nowrap py-2.5 pr-2 font-medium text-slate-800" title={item.productName}>
                              {item.productName}
                            </td>
                            <td className="truncate whitespace-nowrap px-2 py-2.5 font-normal text-slate-500" title={item.variantSku || "--"}>
                              {item.variantSku || "--"}
                            </td>
                            <td className="truncate whitespace-nowrap px-2 py-2.5 text-center font-normal text-slate-600">
                              {item.variantSize || "-"}
                            </td>
                            <td className="truncate whitespace-nowrap px-2 py-2.5 text-center font-normal text-slate-600">
                              {item.variantColor || "-"}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2.5 text-center font-normal text-slate-700">
                              {item.quantity}
                            </td>
                            <td className="truncate whitespace-nowrap py-2.5 pl-2 text-right font-medium text-blue-700">
                              {formatPrice(item.total ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 truncate text-base font-semibold text-slate-900" title={value}>{value}</p>
    </div>
  );
}
