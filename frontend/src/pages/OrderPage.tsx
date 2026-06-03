import { useState } from "react";
import { Link } from "react-router-dom";
import { useMyOrders } from "../hooks/useOrder";
import { getCustomerOrderStatusLabel, getCustomerOrderStatusTone } from "../lib/orderStatus";
import { formatPrice } from "../utils/formatPrice";

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
        <h1 className="text-3xl font-bold font-titleFont">Đơn hàng của tôi</h1>
        <div className="flex gap-3">
          <Link
            to="/cart"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Giỏ hàng
          </Link>
          <Link
            to="/shop"
            className="px-4 py-2 bg-primeColor text-white rounded-lg hover:bg-gray-800 transition"
          >
            Mua sắm
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="border border-dashed border-gray-200 p-8 text-center">
          <p className="text-lightText mb-4">Bạn chưa có đơn hàng nào.</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-primeColor text-white rounded-lg hover:bg-gray-800 transition"
          >
            Bắt đầu mua sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-lightText">
            {total > 0 ? `${total} Đơn hàng` : "Đang hiển thị đơn hàng gần đây"}
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
                      Mã đơn: #{order.id.slice(-8).toUpperCase()}
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
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCustomerOrderStatusTone(order.status, order.isPaid)}`}
                    >
                      {getCustomerOrderStatusLabel(order.status, order.isPaid)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-lightText border-t border-gray-100 pt-4">
                  {order.itemCount} sản phẩm
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
                Trước
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
