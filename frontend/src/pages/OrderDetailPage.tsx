import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMyOrder } from "../hooks/useOrder";
import { cancelMyOrderApi } from "../services/orderService";
import { useToast } from "../context/toastContext";
import { formatPrice } from "../utils/formatPrice";

function getStatusLabel(status: string) {
  switch (status) {
    case "Pending":
      return "Chờ xử lý";
    case "Processing":
      return "Đang xử lý";
    case "Shipping":
      return "Đang giao";
    case "Completed":
      return "Hoàn thành";
    case "Cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { order, isLoading, isError, error, refetch } = useMyOrder(id);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order) return;

    try {
      setCancelling(true);
      await cancelMyOrderApi(order.id);
      showToast("Hủy đơn hàng thành công", "success");
      await refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Không thể hủy đơn hàng", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-container mx-auto px-10 py-12 space-y-4">
        <div className="h-24 bg-gray-100 animate-skeleton" />
        <div className="h-40 bg-gray-100 animate-skeleton" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-container mx-auto px-10 py-12">
        <p className="text-red-500 mb-4">{error || "Không tìm thấy đơn hàng"}</p>
        <button
          onClick={() => navigate("/orders")}
          className="px-6 py-3 border border-gray-300"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-10 py-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-gray-600 hover:text-primeColor transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách đơn hàng
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-bold font-titleFont">Chi tiết đơn hàng</h1>
          <p className="text-lightText mt-2">Mã đơn: #{order.id.slice(-8).toUpperCase()}</p>
        </div>

        <div className="text-right">
          <p className="text-red-500 font-semibold text-xl">{formatPrice(order.total)}</p>
          <p className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100">{getStatusLabel(order.status)}</p>
        </div>
      </div>

      <div className="border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Sản phẩm</h2>

        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-4 last:border-none">
              <p className="font-medium">{item.productName}</p>
              <p className="text-sm text-lightText">
                {item.variantSku ? `SKU: ${item.variantSku}` : ""}
                {item.variantSize ? ` • Size: ${item.variantSize}` : ""}
                {item.variantColor ? ` • Màu: ${item.variantColor}` : ""}
              </p>

              <div className="flex items-center justify-between mt-2 text-sm">
                <span>Số lượng: {item.quantity}</span>
                <span>{formatPrice(item.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Người nhận:</span> {order.receiverName || "N/A"}</p>
          <p><span className="font-medium">Số điện thoại:</span> {order.receiverPhone || "N/A"}</p>
          <p><span className="font-medium">Địa chỉ:</span> {order.addressLine || "N/A"}</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-lightText">Tạm tính</p>
              <p className="font-medium">{formatPrice(order.subtotal)}</p>
            </div>
            <div>
              <p className="text-lightText">Phí ship</p>
              <p className="font-medium">{formatPrice(order.shippingFee)}</p>
            </div>
            <div>
              <p className="text-lightText">Tổng cộng</p>
              <p className="font-medium text-red-500">{formatPrice(order.total)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Thanh toán</h2>

        <div className="space-y-3">
          {order.payments.map((payment, idx) => (
            <div key={idx} className="text-sm border border-gray-100 rounded-lg p-3">
              <div className="flex justify-between mb-1">
                <span className="font-medium">Phương thức:</span>
                <span>{payment.method}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Trạng thái:</span>
                <span className={payment.status === "Paid" ? "text-green-600" : payment.status === "Failed" ? "text-red-600" : "text-yellow-600"}>
                  {payment.status}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Số tiền:</span>
                <span>{formatPrice(payment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Mã giao dịch:</span>
                <span className="text-xs">{payment.transactionNo}</span>
              </div>
              {payment.vnpTransactionId && <p className="mt-2 text-xs text-gray-500">VNPay Transaction: {payment.vnpTransactionId}</p>}
              {payment.vnpBankCode && <p className="text-xs text-gray-500">Ngân hàng: {payment.vnpBankCode}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {order.status === "Pending" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50"
          >
            {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
          </button>
        )}
        <Link
          to="/cart"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}