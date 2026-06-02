import type { OrderDto } from "../@types/order.type";

export const customerOrderSteps = [
  {
    key: "placed",
    label: "Đã đặt hàng",
    icon: "mdi:clipboard-check-outline",
  },
  {
    key: "paid",
    label: "Đơn hàng đã thanh toán",
    icon: "mdi:credit-card-check-outline",
  },
  {
    key: "carrier",
    label: "Đã giao tới đơn vị vận chuyển",
    icon: "mdi:truck-check-outline",
  },
  {
    key: "delivery",
    label: "Chờ giao hàng",
    icon: "mdi:truck-fast-outline",
  },
  {
    key: "review",
    label: "Đánh giá đơn hàng",
    icon: "mdi:star-check-outline",
  },
] as const;

export type CustomerOrderStepKey = (typeof customerOrderSteps)[number]["key"];

const exceptionLabels: Record<string, string> = {
  Cancelled: "Đã hủy",
  DeliveryFailed: "Giao hàng thất bại",
  ReturnRequested: "Yêu cầu hoàn trả",
  ReturnApproved: "Đã duyệt hoàn trả",
  ReturnRejected: "Từ chối hoàn trả",
  Returned: "Đã nhận hàng hoàn",
  Refunded: "Đã hoàn tiền",
};

export function isExceptionOrderStatus(status: string) {
  return status in exceptionLabels;
}

export function hasPaidOrder(order?: Pick<OrderDto, "payments" | "statusHistory"> | null) {
  if (!order) return false;
  return (
    order.payments?.some((payment) => payment.status === "Paid") ||
    order.statusHistory?.some((history) => history.status === "PaymentSucceeded")
  );
}

export function getCustomerOrderStep(status: string, isPaid = false): CustomerOrderStepKey {
  if (status === "Completed" || status === "Delivered") return "review";
  if (["Shipping", "InTransit", "OutForDelivery"].includes(status)) return "delivery";
  if (status === "HandoverToCarrier") return "carrier";
  if (status === "PaymentSucceeded" || isPaid) return "paid";
  return "placed";
}

export function getCustomerOrderStatusLabel(status: string, isPaid = false) {
  if (exceptionLabels[status]) return exceptionLabels[status];

  const stepKey = getCustomerOrderStep(status, isPaid);
  return customerOrderSteps.find((step) => step.key === stepKey)?.label ?? status;
}

export function getCustomerOrderStatusTone(status: string, isPaid = false) {
  if (status === "Cancelled" || status === "DeliveryFailed" || status === "ReturnRejected") {
    return "text-red-700 bg-red-50";
  }

  if (["ReturnRequested", "ReturnApproved", "Returned", "Refunded"].includes(status)) {
    return "text-violet-700 bg-violet-50";
  }

  const stepKey = getCustomerOrderStep(status, isPaid);
  const tones: Record<CustomerOrderStepKey, string> = {
    placed: "text-amber-700 bg-amber-50",
    paid: "text-emerald-700 bg-emerald-50",
    carrier: "text-sky-700 bg-sky-50",
    delivery: "text-indigo-700 bg-indigo-50",
    review: "text-green-700 bg-green-50",
  };

  return tones[stepKey];
}

export function getCompletedCustomerOrderSteps(
  status: string,
  isPaid = false
): Record<CustomerOrderStepKey, boolean> {
  const reviewReady = status === "Delivered" || status === "Completed";
  const deliveryStarted = ["Shipping", "InTransit", "OutForDelivery", "Delivered", "Completed"].includes(status);
  const carrierStarted = ["HandoverToCarrier", "Shipping", "InTransit", "OutForDelivery", "Delivered", "Completed"].includes(status);

  return {
    placed: status !== "Pending" || isPaid,
    paid: isPaid || ["HandoverToCarrier", "Shipping", "InTransit", "OutForDelivery", "Delivered", "Completed"].includes(status),
    carrier: carrierStarted,
    delivery: deliveryStarted,
    review: reviewReady,
  };
}
