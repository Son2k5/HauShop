import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { OrderDto, OrderStatusHistoryDto, ShippingDetailDto } from "../@types/order.type";
import { useToast } from "../context/toastContext";
import { useMyOrder } from "../hooks/useOrder";
import { cancelMyOrderApi, completeMyOrderApi } from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";

const primaryFlow = [
  "PaymentSucceeded",
  "OrderPlaced",
  "SellerConfirmed",
  "Packing",
  "HandoverToCarrier",
  "InTransit",
  "OutForDelivery",
  "Delivered",
  "Completed",
] as const;

const statusLabels: Record<string, string> = {
  Pending: "Cho thanh toan",
  Processing: "Dang xu ly",
  Shipping: "Dang giao",
  PaymentSucceeded: "Thanh toan thanh cong",
  OrderPlaced: "Da dat hang",
  SellerConfirmed: "Nguoi ban xac nhan",
  Packing: "Dang dong goi",
  HandoverToCarrier: "Da giao don vi van chuyen",
  InTransit: "Dang van chuyen",
  OutForDelivery: "Dang giao hang",
  Delivered: "Giao hang thanh cong",
  Completed: "Hoan tat",
  DeliveryFailed: "Giao hang that bai",
  Cancelled: "Da huy",
  ReturnRequested: "Yeu cau hoan tra",
  ReturnApproved: "Da duyet hoan tra",
  ReturnRejected: "Tu choi hoan tra",
  Returned: "Da nhan hang hoan",
  Refunded: "Da hoan tien",
};

const statusTone: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Processing: "bg-blue-50 text-blue-700",
  Shipping: "bg-cyan-50 text-cyan-700",
  PaymentSucceeded: "bg-emerald-50 text-emerald-700",
  OrderPlaced: "bg-amber-50 text-amber-700",
  SellerConfirmed: "bg-blue-50 text-blue-700",
  Packing: "bg-orange-50 text-orange-700",
  HandoverToCarrier: "bg-sky-50 text-sky-700",
  InTransit: "bg-cyan-50 text-cyan-700",
  OutForDelivery: "bg-indigo-50 text-indigo-700",
  Delivered: "bg-teal-50 text-teal-700",
  Completed: "bg-emerald-50 text-emerald-700",
  DeliveryFailed: "bg-rose-50 text-rose-700",
  Cancelled: "bg-red-50 text-red-700",
  ReturnRequested: "bg-violet-50 text-violet-700",
  ReturnApproved: "bg-indigo-50 text-indigo-700",
  ReturnRejected: "bg-red-50 text-red-700",
  Returned: "bg-cyan-50 text-cyan-700",
  Refunded: "bg-slate-100 text-slate-700",
};

const stepIcons: Record<string, string> = {
  PaymentSucceeded: "mdi:credit-card-check-outline",
  OrderPlaced: "mdi:clipboard-check-outline",
  SellerConfirmed: "mdi:store-check-outline",
  Packing: "mdi:package-variant-closed",
  HandoverToCarrier: "mdi:truck-check-outline",
  InTransit: "mdi:truck-fast-outline",
  OutForDelivery: "mdi:bike-fast",
  Delivered: "mdi:home-check-outline",
  Completed: "mdi:check-decagram-outline",
};

function formatStatus(status: string) {
  return statusLabels[status] ?? status;
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

function isCustomerCancellable(status: string) {
  return ["Pending", "OrderPlaced", "SellerConfirmed", "Packing"].includes(status);
}

function isExceptionStatus(status: string) {
  return ["Cancelled", "DeliveryFailed", "ReturnRequested", "ReturnApproved", "ReturnRejected", "Returned", "Refunded"].includes(status);
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { order, isLoading, isError, error, refetch } = useMyOrder(id);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);

  const latestPayment = useMemo(
    () => order?.payments.slice().sort((a, b) => b.transactionNo.localeCompare(a.transactionNo))[0],
    [order?.payments]
  );

  const handleCancel = async () => {
    if (!order) return;

    try {
      setCancelling(true);
      await cancelMyOrderApi(order.id);
      showToast("Da huy don hang thanh cong", "success");
      await refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Khong the huy don hang", "error");
    } finally {
      setCancelling(false);
    }
  };

  const handleComplete = async () => {
    if (!order) return;

    try {
      setCompleting(true);
      await completeMyOrderApi(order.id);
      showToast("Da xac nhan nhan hang", "success");
      await refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Khong the xac nhan nhan hang", "error");
    } finally {
      setCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-container space-y-4 px-4 py-12 sm:px-6 lg:px-10">
        <div className="h-24 animate-skeleton bg-gray-100" />
        <div className="h-56 animate-skeleton bg-gray-100" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-10">
        <p className="mb-4 text-red-500">{error || "Khong tim thay don hang"}</p>
        <button onClick={() => navigate("/orders")} className="border border-gray-300 px-6 py-3">
          Quay lai
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-4 py-10 sm:px-6 lg:px-10">
      <button
        onClick={() => navigate("/orders")}
        className="mb-6 flex items-center gap-2 text-sm text-gray-600 transition hover:text-primeColor"
      >
        <Icon icon="mdi:chevron-left" width={22} />
        Quay lai danh sach don hang
      </button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-titleFont text-3xl font-bold">Chi tiet don hang</h1>
          <p className="mt-2 text-lightText">Ma don: #{order.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xl font-semibold text-red-500">{formatPrice(order.total)}</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusTone[order.status] ?? "bg-gray-100 text-gray-700"}`}>
            {formatStatus(order.status)}
          </span>
        </div>
      </div>

      <OrderTimeline order={order} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <ShippingTracker shipping={order.shipping} statusHistory={order.statusHistory} />
          <OrderItems order={order} />
        </div>

        <div className="space-y-6">
          <section className="border border-gray-200 p-5">
            <h2 className="mb-4 text-lg font-semibold">Thong tin giao hang</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Nguoi nhan:</span> {order.receiverName || "N/A"}</p>
              <p><span className="font-medium">So dien thoai:</span> {order.receiverPhone || "N/A"}</p>
              <p><span className="font-medium">Dia chi:</span> {order.addressLine || "N/A"}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                <Amount label="Tam tinh" value={formatPrice(order.subtotal)} />
                <Amount label="Phi ship" value={formatPrice(order.shippingFee)} />
                <Amount label="Tong" value={formatPrice(order.total)} highlight />
              </div>
            </div>
          </section>

          <section className="border border-gray-200 p-5">
            <h2 className="mb-4 text-lg font-semibold">Thanh toan</h2>
            <div className="space-y-3">
              {order.payments.map((payment) => (
                <div key={payment.id} className="border border-gray-100 p-3 text-sm">
                  <InfoRow label="Phuong thuc" value={payment.method} />
                  <InfoRow label="Trang thai" value={payment.status} valueClass={payment.status === "Paid" ? "text-green-600" : payment.status === "Failed" ? "text-red-600" : "text-yellow-600"} />
                  <InfoRow label="So tien" value={formatPrice(payment.amount)} />
                  <InfoRow label="Ma giao dich" value={payment.transactionNo} valueClass="text-xs" />
                  {payment.vnpTransactionId ? <p className="mt-2 text-xs text-gray-500">VNPay: {payment.vnpTransactionId}</p> : null}
                  {payment.vnpBankCode ? <p className="text-xs text-gray-500">Ngan hang: {payment.vnpBankCode}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {isCustomerCancellable(order.status) ? (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {cancelling ? "Dang huy..." : "Huy don hang"}
          </button>
        ) : null}
        {order.status === "Delivered" ? (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="rounded-lg bg-primeColor px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {completing ? "Dang xac nhan..." : "Da nhan hang"}
          </button>
        ) : null}
        <Link to="/cart" className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50">
          Tiep tuc mua sam
        </Link>
      </div>

      {latestPayment?.status === "Paid" && order.status === "OrderPlaced" ? (
        <p className="mt-4 text-sm text-emerald-700">Thanh toan da thanh cong. Don hang dang cho nguoi ban xac nhan.</p>
      ) : null}
    </div>
  );
}

function OrderTimeline({ order }: { order: OrderDto }) {
  const historyByStatus = new Map((order.statusHistory ?? []).map((item) => [item.status, item]));
  const currentIndex = primaryFlow.findIndex((status) => status === order.status);
  const paid = order.payments.some((payment) => payment.status === "Paid") || historyByStatus.has("PaymentSucceeded");

  return (
    <section className="border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Trang thai don hang</h2>
        {isExceptionStatus(order.status) ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[order.status]}`}>
            {formatStatus(order.status)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-9">
        {primaryFlow.map((status, index) => {
          const history = historyByStatus.get(status);
          const completed = status === "PaymentSucceeded" ? paid : Boolean(history) || (currentIndex >= 0 && index <= currentIndex);
          const active = order.status === status;

          return (
            <div key={status} className="relative flex gap-3 md:block">
              {index < primaryFlow.length - 1 ? (
                <div className="absolute left-4 top-9 h-[calc(100%+1rem)] w-px bg-gray-200 md:left-[calc(50%+1.25rem)] md:top-5 md:h-px md:w-[calc(100%-2.5rem)]" />
              ) : null}
              <div className={[
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-white md:mx-auto",
                completed ? "border-primeColor bg-primeColor" : "border-gray-200 bg-gray-300",
                active ? "ring-4 ring-gray-100" : "",
              ].join(" ")}>
                <Icon icon={stepIcons[status]} width={19} />
              </div>
              <div className="min-w-0 md:mt-3 md:text-center">
                <p className="text-sm font-semibold text-gray-900">{formatStatus(status)}</p>
                <p className="mt-1 text-xs leading-5 text-lightText">{history ? formatDateTime(history.created) : completed ? "Da cap nhat" : "Dang cho"}</p>
              </div>
            </div>
          );
        })}
      </div>

      {isExceptionStatus(order.status) ? (
        <div className="mt-5 border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold">{formatStatus(order.status)}</p>
          <p className="mt-1">{order.statusHistory[order.statusHistory.length - 1]?.description ?? "Don hang co cap nhat ngoai le."}</p>
        </div>
      ) : null}
    </section>
  );
}

function ShippingTracker({
  shipping,
  statusHistory,
}: {
  shipping?: ShippingDetailDto | null;
  statusHistory: OrderStatusHistoryDto[];
}) {
  const events = shipping?.trackingEvents ?? [];

  return (
    <section className="border border-gray-200 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Theo doi van chuyen</h2>
          <p className="text-sm text-lightText">{shipping?.carrierName || "Chua co don vi van chuyen"}</p>
        </div>
        {shipping?.trackingUrl ? (
          <a href={shipping.trackingUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primeColor">
            Mo tracking
          </a>
        ) : null}
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <InfoBlock label="Ma van don" value={shipping?.trackingNumber || "Chua cap nhat"} />
        <InfoBlock label="Vi tri hien tai" value={shipping?.currentLocation || "Chua cap nhat"} />
        <InfoBlock label="Du kien giao" value={shipping?.estimatedDelivery ? formatDateTime(shipping.estimatedDelivery) : "Chua cap nhat"} />
      </div>

      <div className="mt-5 space-y-4">
        {(events.length ? events : statusHistory.slice().reverse()).map((event) => (
          <div key={event.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
            <span className="mt-1 h-3 w-3 rounded-full bg-primeColor" />
            <div>
              <p className="font-semibold text-gray-900">{event.title || formatStatus(event.status)}</p>
              <p className="text-sm text-gray-600">{event.description}</p>
              {"location" in event && event.location ? <p className="text-xs text-gray-500">{event.location}</p> : null}
              <p className="mt-1 text-xs text-lightText">{formatDateTime("occurredAt" in event ? event.occurredAt : event.created)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderItems({ order }: { order: OrderDto }) {
  return (
    <section className="border border-gray-200 p-5">
      <h2 className="mb-4 text-lg font-semibold">San pham</h2>
      <div className="space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="border-b border-gray-100 pb-4 last:border-none">
            <p className="font-medium">{item.productName}</p>
            <p className="text-sm text-lightText">
              {item.variantSku ? `SKU: ${item.variantSku}` : ""}
              {item.variantSize ? ` | Size: ${item.variantSize}` : ""}
              {item.variantColor ? ` | Mau: ${item.variantColor}` : ""}
            </p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>So luong: {item.quantity}</span>
              <span>{formatPrice(item.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Amount({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-lightText">{label}</p>
      <p className={highlight ? "font-medium text-red-500" : "font-medium"}>{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="mb-1 flex justify-between gap-3">
      <span className="font-medium">{label}:</span>
      <span className={["text-right", valueClass].join(" ")}>{value}</span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs uppercase text-lightText">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-900">{value}</p>
    </div>
  );
}
