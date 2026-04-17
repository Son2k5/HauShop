import { Link } from "react-router-dom";
import { useMyOrders } from "../hooks/useOrder";
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

function getStatusColor(status: string) {
  switch (status) {
    case "Pending":
      return "text-yellow-600 bg-yellow-50";
    case "Processing":
      return "text-blue-600 bg-blue-50";
    case "Shipping":
      return "text-purple-600 bg-purple-50";
    case "Completed":
      return "text-green-600 bg-green-50";
    case "Cancelled":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export default function MyOrdersPage() {
  const { orders, isLoading, isError, error } = useMyOrders();

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
            Bắt đầu mua sắm
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block border border-gray-200 p-5 hover:border-primeColor hover:shadow-md transition"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-lg">Mã đơn: #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-lightText">
                    {new Date(order.created).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-red-500 text-lg">{formatPrice(order.total)}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-sm text-lightText border-t border-gray-100 pt-4">
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="bg-gray-50 px-2 py-1 rounded">
                      {item.productName} x {item.quantity}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-gray-400">+ {order.items.length - 3} sản phẩm khác</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}