import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { clearCart } from "../store/cartSlice";
import { checkoutApi } from "../services/orderService";
import { userService } from "../services/userService";
import { useToast } from "../context/toastContext";
import { formatPrice } from "../utils/formatPrice";
import type { AddressDto } from "../@types/address.type";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const cart = useAppSelector((state) => state.cart);

  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [shippingAddressId, setShippingAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<0 | 1>(0);
  const shippingFee = 30000; // Backend sẽ tính phí ship dựa trên địa chỉ
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch user addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddressesLoading(true);
        const data = await userService.getAddresses();
        setAddresses(data);
        // Auto-select default address if exists
        const defaultAddress = data.find((a) => a.isDefault);
        if (defaultAddress) {
          setShippingAddressId(defaultAddress.id);
        } else if (data.length > 0) {
          setShippingAddressId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
        showToast("Không thể tải danh sách địa chỉ", "error");
      } finally {
        setAddressesLoading(false);
      }
    };

    fetchAddresses();
  }, [showToast]);

  const subtotal = useMemo(() => {
    return cart.items.reduce((sum: number, item: any) => {
      return sum + (item.unitPrice || 0) * (item.qty || 0);
    }, 0);
  }, [cart.items]);

  const total = subtotal + shippingFee;

  const handleCheckout = async () => {
    if (!cart.items.length) {
      showToast("Giỏ hàng đang trống", "warning");
      return;
    }

    if (!shippingAddressId.trim()) {
      showToast("Vui lòng chọn địa chỉ giao hàng", "warning");
      return;
    }

    try {
      setSubmitting(true);

      const res = await checkoutApi({
        shippingAddressId,
        paymentMethod,
        shippingFee,
        note: note.trim() || undefined,
      });

      if (paymentMethod === 0) {
        dispatch(clearCart());
        showToast("Đặt hàng thành công", "success");
        navigate(`/orders/${res.order.id}`);
        return;
      }

      if (res.requiresRedirect && res.paymentUrl) {
        window.location.href = res.paymentUrl;
        return;
      }

      showToast("Không tạo được link thanh toán", "error");
    } catch (err: any) {
      console.error(err);
      showToast(
        err?.response?.data?.message || "Không thể đặt hàng",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === shippingAddressId);

  return (
    <div className="max-w-container mx-auto px-10 py-12">
      <h1 className="text-3xl font-bold font-titleFont mb-8">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Thông tin giao hàng</h2>
              <Link
                to="/orders"
                className="text-sm text-primeColor hover:underline"
              >
                Xem đơn hàng của tôi →
              </Link>
            </div>

            {addressesLoading ? (
              <div className="h-20 bg-gray-100 animate-pulse rounded" />
            ) : addresses.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-200 rounded">
                <p className="text-sm text-gray-500 mb-2">Bạn chưa có địa chỉ nào</p>
                <Link
                  to="/profile"
                  className="text-sm text-primeColor hover:underline"
                >
                  Thêm địa chỉ mới →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition ${
                      shippingAddressId === address.id
                        ? "border-primeColor bg-primeColor/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingAddress"
                      value={address.id}
                      checked={shippingAddressId === address.id}
                      onChange={() => setShippingAddressId(address.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{address.displayText}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {address.city}, {address.country}
                      </p>
                      {address.isDefault && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          Mặc định
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <label className="block text-sm font-medium mb-2 mt-5">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 px-4 py-3 outline-none focus:border-primeColor resize-none"
              placeholder="Giao giờ hành chính, gọi trước khi giao..."
            />
          </div>

          <div className="border border-gray-200 p-5">
            <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMethod === 0}
                  onChange={() => setPaymentMethod(0)}
                />
                <span>Thanh toán khi nhận hàng (COD)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMethod === 1}
                  onChange={() => setPaymentMethod(1)}
                />
                <span>Thanh toán qua VNPay</span>
              </label>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 p-5 h-fit">
          <h2 className="text-lg font-semibold mb-5">Đơn hàng của bạn</h2>

          <div className="space-y-4 mb-6">
            {cart.items.map((item: any, idx: number) => (
              <div key={`${item.productId}-${item.variantId}-${idx}`} className="border-b border-gray-100 pb-4">
                <p className="font-medium">{item.product?.name || "Sản phẩm"}</p>
                <p className="text-sm text-lightText">
                  {item.variantSku ? `SKU: ${item.variantSku}` : ""}
                  {item.variantSize ? ` • Size: ${item.variantSize}` : ""}
                  {item.variantColor ? ` • Màu: ${item.variantColor}` : ""}
                </p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span>Số lượng: {item.qty}</span>
                  <span>{formatPrice((item.unitPrice || 0) * (item.qty || 0))}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex items-center justify-between">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Phí ship</span>
              <span className="text-gray-500">{formatPrice(shippingFee)}</span>
            </div>
            {selectedAddress && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Giao đến</span>
                <span className="text-right max-w-[200px] truncate">{selectedAddress.displayText}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold text-base border-t border-gray-200 pt-3">
              <span>Tổng cộng</span>
              <span className="text-red-500">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting || !cart.items.length || !shippingAddressId}
            className="w-full py-4 bg-primeColor text-white font-semibold tracking-widest hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang xử lý..." : "Đặt hàng"}
          </button>
        </div>
      </div>
    </div>
  );
}
