import { useState } from "react";
import { Link } from "react-router-dom";
import { OrderStatuses } from "../@types/enums.type";
import { useMyOrders } from "../hooks/useOrder";
import { getCustomerOrderStatusLabel, getCustomerOrderStatusTone } from "../lib/orderStatus";
import { ROUTES } from "../lib/routes";
import { formatPrice } from "../utils/formatPrice";

const cancellationStatuses = [OrderStatuses.Cancelled] as const;

export default function MyCancellationsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { orders, total, totalPages, isLoading, isError, error } = useMyOrders(
    page,
    pageSize,
    cancellationStatuses
  );
  const canGoPrevious = page > 1;
  const canGoNext = totalPages > 0 && page < totalPages;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-container space-y-4 px-4 py-12 sm:px-6 lg:px-10">
        <div className="h-24 animate-skeleton bg-gray-100" />
        <div className="h-24 animate-skeleton bg-gray-100" />
        <div className="h-24 animate-skeleton bg-gray-100" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-10">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Account</p>
          <h1 className="mt-2 font-titleFont text-3xl font-bold text-gray-950">Đơn hàng đã hủy</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={ROUTES.ORDERS}
            className="inline-flex h-10 items-center justify-center border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:border-gray-950 hover:text-gray-950"
          >
            Đơn hàng của tôi
          </Link>
          <Link
            to={ROUTES.REVIEWS}
            className="inline-flex h-10 items-center justify-center border border-gray-950 bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Đánh giá sản phẩm
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="border border-dashed border-gray-200 px-6 py-10 text-center">
          <p className="text-sm text-lightText">Bạn chưa có đơn hàng đã hủy.</p>
          <Link
            to={ROUTES.ORDERS}
            className="mt-5 inline-flex h-11 items-center justify-center bg-primeColor px-6 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Xem đơn hàng
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-lightText">{total} đơn hàng đã hủy</p>

          <div className="space-y-5">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block border border-gray-200 bg-white p-5 transition hover:border-primeColor hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-950">
                      Mã đơn: #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-lightText">
                      {new Date(order.created).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-lg font-semibold text-gray-950">{formatPrice(order.total)}</p>
                    <span
                      className={[
                        "mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                        getCustomerOrderStatusTone(order.status, order.isPaid),
                      ].join(" ")}
                    >
                      {getCustomerOrderStatusLabel(order.status, order.isPaid)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4 text-sm text-lightText">
                  {order.itemCount} sản phẩm
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canGoPrevious}
                className="h-10 border border-gray-300 px-4 text-sm disabled:opacity-50"
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
                className="h-10 border border-gray-300 px-4 text-sm disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
