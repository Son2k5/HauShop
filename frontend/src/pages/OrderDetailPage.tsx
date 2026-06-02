import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { OrderDto, OrderStatusHistoryDto, ShippingDetailDto } from "../@types/order.type";
import { useToast } from "../context/toastContext";
import { useMyOrder } from "../hooks/useOrder";
import {
  customerOrderSteps,
  getCompletedCustomerOrderSteps,
  getCustomerOrderStatusLabel,
  getCustomerOrderStatusTone,
  getCustomerOrderStep,
  hasPaidOrder,
  isExceptionOrderStatus,
} from "../lib/orderStatus";
import { cancelMyOrderApi, completeMyOrderApi } from "../services/orderService";
import { createReviewApi } from "../services/reviewService";
import { formatPrice } from "../utils/formatPrice";

function formatStatus(status: string, isPaid = false) {
  return getCustomerOrderStatusLabel(status, isPaid);
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

function isCustomerCancellable(status: string) {
  return ["Pending", "OrderPlaced", "SellerConfirmed", "Packing"].includes(status);
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { order, isLoading, isError, error, refetch } = useMyOrder(id);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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
      setReviewModalOpen(true);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Khong the xac nhan nhan hang", "error");
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmitOrderReview = async () => {
    if (!order) return;

    const productIds = Array.from(new Set(order.items.map((item) => item.productId).filter(Boolean)));
    if (!productIds.length) {
      showToast("Không có sản phẩm để đánh giá", "warning");
      return;
    }

    try {
      setReviewSubmitting(true);
      let successCount = 0;
      let firstError: any = null;

      for (const productId of productIds) {
        try {
          await createReviewApi({
            productId,
            rating: reviewRating,
            content: reviewContent.trim() || undefined,
          });
          successCount += 1;
        } catch (err) {
          firstError ??= err;
        }
      }

      if (successCount > 0) {
        showToast("Đã gửi đánh giá đơn hàng", "success");
        setReviewModalOpen(false);
        setReviewContent("");
        setReviewRating(5);
        return;
      }

      showToast(firstError?.response?.data?.message || "Không thể gửi đánh giá", "error");
    } finally {
      setReviewSubmitting(false);
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

  const orderPaid = hasPaidOrder(order);

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
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${getCustomerOrderStatusTone(order.status, orderPaid)}`}>
            {formatStatus(order.status, orderPaid)}
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
        {order.status === "Completed" ? (
          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600"
          >
            Đánh giá đơn hàng
          </button>
        ) : null}
        <Link to="/cart" className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50">
          Tiep tuc mua sam
        </Link>
      </div>

      {latestPayment?.status === "Paid" && order.status === "OrderPlaced" ? (
        <p className="mt-4 text-sm text-emerald-700">Đơn hàng đã thanh toán và đang chờ xử lý.</p>
      ) : null}

      {reviewModalOpen ? (
        <OrderReviewModal
          rating={reviewRating}
          content={reviewContent}
          submitting={reviewSubmitting}
          onRatingChange={setReviewRating}
          onContentChange={setReviewContent}
          onSubmit={handleSubmitOrderReview}
          onClose={() => setReviewModalOpen(false)}
        />
      ) : null}
    </div>
  );
}

function OrderTimeline({ order }: { order: OrderDto }) {
  const historyByStatus = new Map((order.statusHistory ?? []).map((item) => [item.status, item]));
  const paid = hasPaidOrder(order);
  const activeStep = getCustomerOrderStep(order.status, paid);
  const completedSteps = getCompletedCustomerOrderSteps(order.status, paid);

  const getStepHistory = (stepKey: string) => {
    const statusGroups: Record<string, OrderStatusHistoryDto["status"][]> = {
      placed: ["OrderPlaced", "Pending", "SellerConfirmed", "Packing", "Processing"],
      paid: ["PaymentSucceeded"],
      carrier: ["HandoverToCarrier"],
      delivery: ["OutForDelivery", "InTransit", "Shipping", "Delivered"],
      review: ["Completed", "Delivered"],
    };

    return statusGroups[stepKey]?.map((status) => historyByStatus.get(status)).find(Boolean);
  };

  return (
    <section className="border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Trang thai don hang</h2>
        {isExceptionOrderStatus(order.status) ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getCustomerOrderStatusTone(order.status, paid)}`}>
            {formatStatus(order.status, paid)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {customerOrderSteps.map((step, index) => {
          const history = getStepHistory(step.key);
          const completed = completedSteps[step.key];
          const active = activeStep === step.key && !isExceptionOrderStatus(order.status);

          return (
            <div key={step.key} className="relative flex gap-3 md:block">
              {index < customerOrderSteps.length - 1 ? (
                <div className="absolute left-4 top-9 h-[calc(100%+1rem)] w-px bg-gray-200 md:left-[calc(50%+1.25rem)] md:top-5 md:h-px md:w-[calc(100%-2.5rem)]" />
              ) : null}
              <div className={[
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-white md:mx-auto",
                completed ? "border-primeColor bg-primeColor" : "border-gray-200 bg-gray-300",
                active ? "ring-4 ring-gray-100" : "",
              ].join(" ")}>
                <Icon icon={step.icon} width={19} />
              </div>
              <div className="min-w-0 md:mt-3 md:text-center">
                <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-lightText">{history ? formatDateTime(history.created) : completed ? "Da cap nhat" : "Dang cho"}</p>
              </div>
            </div>
          );
        })}
      </div>

      {isExceptionOrderStatus(order.status) ? (
        <div className="mt-5 border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold">{formatStatus(order.status, paid)}</p>
          <p className="mt-1">{order.statusHistory[order.statusHistory.length - 1]?.description ?? "Don hang co cap nhat ngoai le."}</p>
        </div>
      ) : null}
    </section>
  );
}

function OrderReviewModal({
  rating,
  content,
  submitting,
  onRatingChange,
  onContentChange,
  onSubmit,
  onClose,
}: {
  rating: number;
  content: string;
  submitting: boolean;
  onRatingChange: (rating: number) => void;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-md bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Đánh giá đơn hàng</h3>
              <p className="mt-1 text-sm text-lightText">Chọn số sao và để lại cảm nhận của bạn.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">Số sao</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onRatingChange(star)}
                  className="text-amber-400 transition hover:scale-105"
                  aria-label={`${star} sao`}
                >
                  <Icon icon={star <= rating ? "mdi:star" : "mdi:star-outline"} width={34} />
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Nội dung đánh giá
            <textarea
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-2 w-full resize-none border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-primeColor"
              placeholder="Sản phẩm và trải nghiệm giao hàng của bạn thế nào?"
            />
          </label>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="w-full bg-primeColor px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
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
