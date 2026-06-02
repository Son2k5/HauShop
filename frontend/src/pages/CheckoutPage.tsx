import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { cartDtoToState, emptyCartState } from "../lib/cart";
import { checkoutApi } from "../services/orderService";
import { userService } from "../services/userService";
import { useToast } from "../context/toastContext";
import { formatPrice } from "../utils/formatPrice";
import type { AddressDto, CreateAddressDto } from "../@types/address.type";
import { queryKeys } from "../lib/queryKeys";
import { logger } from "../lib/logger";
import { useAuth } from "../hooks/useAuth";
import { ROUTES, routeTo } from "../lib/routes";
import { PaymentMethods, type PaymentMethod } from "../@types/enums.type";

const emptyAddressForm: CreateAddressDto = {
  addressLine: "",
  city: "",
  state: "",
  country: "Vietnam",
  zipCode: "",
  isDefault: false,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const cartQuery = useCart({ enabled: isAuthenticated });
  const cart = useMemo(
    () => (isAuthenticated ? cartDtoToState(cartQuery.data) : emptyCartState),
    [cartQuery.data, isAuthenticated]
  );

  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [shippingAddressId, setShippingAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethods.COD);
  const shippingFee = 30000; // Backend sẽ tính phí ship dựa trên địa chỉ
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<"select" | "create">("select");
  const [addressForm, setAddressForm] = useState<CreateAddressDto>(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);

  // Fetch user addresses on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([]);
      setAddressesLoading(false);
      setShippingAddressId("");
      return;
    }

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
        logger.error("Failed to fetch addresses", error);
        showToast("Không thể tải danh sách địa chỉ", "error");
      } finally {
        setAddressesLoading(false);
      }
    };

    fetchAddresses();
  }, [isAuthenticated, showToast]);

  const openAddressModal = (mode: "select" | "create") => {
    setAddressModalMode(mode);
    setAddressForm({
      ...emptyAddressForm,
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const handleAddressFormChange = (key: keyof CreateAddressDto, value: string | boolean) => {
    setAddressForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreateAddress = async () => {
    if (!addressForm.addressLine.trim() || !addressForm.city.trim()) {
      showToast("Vui lòng nhập địa chỉ và tỉnh/thành phố", "warning");
      return;
    }

    try {
      setSavingAddress(true);
      const created = await userService.createAddress({
        ...addressForm,
        addressLine: addressForm.addressLine.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state?.trim(),
        country: addressForm.country?.trim() || "Vietnam",
        zipCode: addressForm.zipCode?.trim(),
        isDefault: addresses.length === 0 || addressForm.isDefault,
      });

      setAddresses((current) => {
        const next = created.isDefault
          ? current.map((address) => ({ ...address, isDefault: false }))
          : current;
        return [...next, created];
      });
      setShippingAddressId(created.id);
      setAddressModalOpen(false);
      showToast("Đã thêm địa chỉ giao hàng", "success");
    } catch (error) {
      logger.error("Failed to create address", error);
      showToast("Không thể thêm địa chỉ", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const subtotal = useMemo(() => {
    return cart.items.reduce((sum: number, item: any) => {
      return sum + (item.unitPrice || 0) * (item.qty || 0);
    }, 0);
  }, [cart.items]);

  const total = subtotal + shippingFee;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      showToast("Vui long dang nhap de thanh toan", "warning");
      navigate(ROUTES.SIGN_IN);
      return;
    }

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

      if (paymentMethod === PaymentMethods.COD) {
        queryClient.removeQueries({ queryKey: queryKeys.cart.me });
        queryClient.setQueryData(queryKeys.orders.detail(res.order.id), res.order);
        await queryClient.invalidateQueries({ queryKey: queryKeys.orders.mineRoot });
        showToast("Đặt hàng thành công", "success");
        navigate(routeTo.order(res.order.id));
        return;
      }

      if (res.requiresRedirect && res.paymentUrl) {
        window.location.href = res.paymentUrl;
        return;
      }

      showToast("Không tạo được link thanh toán", "error");
    } catch (err: any) {
      logger.error("Checkout failed", err);
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
                to={ROUTES.ORDERS}
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
                <button
                  type="button"
                  onClick={() => openAddressModal("create")}
                  className="text-sm font-semibold text-primeColor hover:underline"
                >
                  Thêm địa chỉ mới
                </button>
              </div>
            ) : (
                <div className="border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase text-lightText">Địa chỉ đang chọn</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {selectedAddress?.displayText || "Chưa chọn địa chỉ"}
                      </p>
                      {selectedAddress ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {selectedAddress.city}, {selectedAddress.country}
                        </p>
                      ) : null}
                      {selectedAddress?.isDefault ? (
                        <span className="mt-2 inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Mặc định
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openAddressModal("select")}
                        className="border border-gray-300 px-3 py-2 text-sm font-medium transition hover:bg-gray-50"
                      >
                        Thay đổi
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddressModal("create")}
                        className="bg-primeColor px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        Thêm mới
                      </button>
                    </div>
                  </div>
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
                  checked={paymentMethod === PaymentMethods.COD}
                  onChange={() => setPaymentMethod(PaymentMethods.COD)}
                />
                <span>Thanh toán khi nhận hàng (COD)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMethod === PaymentMethods.VNPay}
                  onChange={() => setPaymentMethod(PaymentMethods.VNPay)}
                />
                <span>Thanh toán qua VNPay</span>
              </label>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 p-5 h-fit">
          <h2 className="text-lg font-semibold mb-5">Đơn hàng của bạn</h2>

          <div className="space-y-4 mb-6">
            {cart.items.map((item: any) => (
              <div key={item.cartItemId} className="border-b border-gray-100 pb-4">
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

      {addressModalOpen ? (
        <AddressModal
          mode={addressModalMode}
          setMode={setAddressModalMode}
          addresses={addresses}
          selectedAddressId={shippingAddressId}
          onSelect={(id) => {
            setShippingAddressId(id);
            setAddressModalOpen(false);
          }}
          form={addressForm}
          onFormChange={handleAddressFormChange}
          onCreate={handleCreateAddress}
          onClose={() => setAddressModalOpen(false)}
          saving={savingAddress}
        />
      ) : null}
    </div>
  );
}

function AddressModal({
  mode,
  setMode,
  addresses,
  selectedAddressId,
  onSelect,
  form,
  onFormChange,
  onCreate,
  onClose,
  saving,
}: {
  mode: "select" | "create";
  setMode: (mode: "select" | "create") => void;
  addresses: AddressDto[];
  selectedAddressId: string;
  onSelect: (id: string) => void;
  form: CreateAddressDto;
  onFormChange: (key: keyof CreateAddressDto, value: string | boolean) => void;
  onCreate: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h3>
            <p className="text-sm text-lightText">Chọn địa chỉ có sẵn hoặc thêm địa chỉ mới.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setMode("select")}
            className={[
              "flex-1 px-4 py-3 text-sm font-semibold",
              mode === "select" ? "border-b-2 border-primeColor text-primeColor" : "text-gray-500",
            ].join(" ")}
          >
            Thay đổi địa chỉ
          </button>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={[
              "flex-1 px-4 py-3 text-sm font-semibold",
              mode === "create" ? "border-b-2 border-primeColor text-primeColor" : "text-gray-500",
            ].join(" ")}
          >
            Thêm địa chỉ mới
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {mode === "select" ? (
            <div className="space-y-3">
              {addresses.length ? (
                addresses.map((address) => (
                  <button
                    type="button"
                    key={address.id}
                    onClick={() => onSelect(address.id)}
                    className={[
                      "w-full border p-4 text-left transition hover:border-primeColor",
                      selectedAddressId === address.id ? "border-primeColor bg-primeColor/5" : "border-gray-200",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{address.displayText}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {address.city}, {address.country}
                        </p>
                      </div>
                      {address.isDefault ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Mặc định</span>
                      ) : null}
                    </div>
                  </button>
                ))
              ) : (
                <div className="border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
                  Chưa có địa chỉ nào.
                </div>
              )}

              <button
                type="button"
                onClick={() => setMode("create")}
                className="w-full border border-gray-300 px-4 py-3 text-sm font-semibold text-primeColor hover:bg-gray-50"
              >
                Thêm địa chỉ mới
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              <AddressInput
                label="Địa chỉ"
                value={form.addressLine}
                onChange={(value) => onFormChange("addressLine", value)}
                placeholder="Số nhà, tên đường..."
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <AddressInput
                  label="Tỉnh/Thành phố"
                  value={form.city}
                  onChange={(value) => onFormChange("city", value)}
                  placeholder="TP. Hồ Chí Minh"
                  required
                />
                <AddressInput
                  label="Quận/Huyện"
                  value={form.state ?? ""}
                  onChange={(value) => onFormChange("state", value)}
                  placeholder="Quận 1"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AddressInput
                  label="Quốc gia"
                  value={form.country ?? ""}
                  onChange={(value) => onFormChange("country", value)}
                  placeholder="Vietnam"
                />
                <AddressInput
                  label="Mã bưu chính"
                  value={form.zipCode ?? ""}
                  onChange={(value) => onFormChange("zipCode", value)}
                  placeholder="700000"
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => onFormChange("isDefault", event.target.checked)}
                />
                Đặt làm địa chỉ mặc định
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className="border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={onCreate}
                  disabled={saving}
                  className="bg-primeColor px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-primeColor"
        placeholder={placeholder}
      />
    </label>
  );
}
