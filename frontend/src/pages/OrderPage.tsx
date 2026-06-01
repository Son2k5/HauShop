import { useState } from "react";
import { Link } from "react-router-dom";
import { useMyOrders } from "../hooks/useOrder";
import { formatPrice } from "../utils/formatPrice";

function getStatusLabel(status: string) {
  switch (status) {
    case "Pending":
      return "Cho thanh toan";
    case "Processing":
      return "Dang xu ly";
    case "Shipping":
      return "Dang giao";
    case "PaymentSucceeded":
      return "Thanh toan thanh cong";
    case "OrderPlaced":
      return "Da dat hang";
    case "SellerConfirmed":
      return "Nguoi ban xac nhan";
    case "Packing":
      return "Dang dong goi";
    case "HandoverToCarrier":
      return "Da giao DVVC";
    case "InTransit":
      return "Dang van chuyen";
    case "OutForDelivery":
      return "Dang giao hang";
    case "Delivered":
      return "Giao thanh cong";
    case "Completed":
      return "Hoan tat";
    case "DeliveryFailed":
      return "Giao that bai";
    case "Cancelled":
      return "Da huy";
    case "ReturnRequested":
      return "Yeu cau hoan hang";
    case "ReturnApproved":
      return "Da duyet hoan hang";
    case "ReturnRejected":
      return "Tu choi hoan hang";
    case "Returned":
      return "Da nhan hang hoan";
    case "Refunded":
      return "Da hoan tien";
    default:
      return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Pending":
      return "text-yellow-600 bg-yellow-50";
    case "Processing":
      return "text-blue-600 bg-blue-50";
    case "Shipping":
      return "text-purple-600 bg-purple-50";
    case "PaymentSucceeded":
      return "text-emerald-700 bg-emerald-50";
    case "OrderPlaced":
      return "text-yellow-700 bg-yellow-50";
    case "SellerConfirmed":
      return "text-blue-700 bg-blue-50";
    case "Packing":
      return "text-orange-700 bg-orange-50";
    case "HandoverToCarrier":
      return "text-sky-700 bg-sky-50";
    case "InTransit":
      return "text-cyan-700 bg-cyan-50";
    case "OutForDelivery":
      return "text-indigo-700 bg-indigo-50";
    case "Delivered":
      return "text-teal-700 bg-teal-50";
    case "Completed":
      return "text-green-600 bg-green-50";
    case "DeliveryFailed":
      return "text-rose-700 bg-rose-50";
    case "Cancelled":
      return "text-red-600 bg-red-50";
    case "ReturnRequested":
      return "text-violet-700 bg-violet-50";
    case "ReturnApproved":
      return "text-indigo-700 bg-indigo-50";
    case "ReturnRejected":
      return "text-red-700 bg-red-50";
    case "Returned":
      return "text-cyan-700 bg-cyan-50";
    case "Refunded":
      return "text-slate-700 bg-slate-100";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export default function MyOrdersPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { orders, total, totalPages, isLoading, isError, error } = useMyOrders(page, pageSize);
  const canGoPrevious = page > 1;
  const canGoNext = totalPages > 0 && page < totalPages;

  if (isLoading) {
    return (
      <div className="max-w-container mx-auto px-10 py-12 space-y-4">
        <div className="h-24 bg-gray-100 animate-skeleton" />
        <div className="h-24 bg-gray-100 animate-skeleton" />
        <div className="h-24 bg-gray-100 animate-skeleton" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-container mx-auto px-10 py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-10 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-titleFont">Don hang cua toi</h1>
        <div className="flex gap-3">
          <Link
            to="/cart"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Gio hang
          </Link>
          <Link
            to="/shop"
            className="px-4 py-2 bg-primeColor text-white rounded-lg hover:bg-gray-800 transition"
          >
            Mua sam
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="border border-dashed border-gray-200 p-8 text-center">
          <p className="text-lightText mb-4">Ban chua co don hang nao.</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-primeColor text-white rounded-lg hover:bg-gray-800 transition"
          >
            Bat dau mua sam
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-lightText">
            {total > 0 ? `${total} don hang` : "Dang hien thi don hang gan day"}
          </p>

          <div className="space-y-5">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block border border-gray-200 p-5 hover:border-primeColor hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-lg">
                      Ma don: #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-lightText">
                      {new Date(order.created).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-red-500 text-lg">
                      {formatPrice(order.total)}
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-lightText border-t border-gray-100 pt-4">
                  {order.itemCount} san pham
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canGoPrevious}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Truoc
              </button>
              <span className="text-sm text-lightText">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!canGoNext}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
