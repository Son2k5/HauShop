import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useCart,
  useClearCart,
  useIncreaseCartItem,
  useRemoveCartItem,
  useUpdateCartItem,
} from "../hooks/useCart";
import { cartDtoToState, emptyCartState } from "../lib/cart";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../context/toastContext";
import { useAuth } from "../hooks/useAuth";

export default function CartPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, status } = useAuth();
  const cartQuery = useCart({ enabled: isAuthenticated });
  const updateCartItem = useUpdateCartItem();
  const increaseCartItem = useIncreaseCartItem();
  const removeCartItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const cart = useMemo(
    () => (isAuthenticated ? cartDtoToState(cartQuery.data) : emptyCartState),
    [cartQuery.data, isAuthenticated]
  );
  const { items, totalQty, subtotal } = cart;
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const shipping = items.length > 0 ? 30000 : 0;
  const total = subtotal + shipping;

  const handleDecrease = async (cartItemId: string | undefined, currentQty: number) => {
    if (!cartItemId) return;

    try {
      setSyncingId(cartItemId);
      if (currentQty <= 1) {
        await removeCartItem.mutateAsync(cartItemId);
      } else {
        await updateCartItem.mutateAsync({ cartItemId, quantity: currentQty - 1 });
      }
    } catch {
      showToast("Khong the cap nhat gio hang", "error");
    } finally {
      setSyncingId(null);
    }
  };

  const handleIncrease = async (
    cartItemId: string | undefined,
    currentQty: number,
    maxQty: number
  ) => {
    if (!cartItemId || currentQty >= maxQty) return;

    try {
      setSyncingId(cartItemId);
      await increaseCartItem.mutateAsync({ cartItemId, quantity: 1 });
    } catch {
      showToast("Khong the cap nhat gio hang", "error");
    } finally {
      setSyncingId(null);
    }
  };

  const handleRemove = async (cartItemId: string | undefined) => {
    if (!cartItemId) return;

    try {
      setSyncingId(cartItemId);
      await removeCartItem.mutateAsync(cartItemId);
      showToast("Da xoa san pham khoi gio hang", "success");
    } catch {
      showToast("Khong the xoa san pham", "error");
    } finally {
      setSyncingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!items.length) return;
    if (!window.confirm("Ban co chac muon xoa toan bo gio hang?")) return;

    try {
      setClearing(true);
      await clearCart.mutateAsync();
      showToast("Da xoa toan bo gio hang", "success");
    } catch {
      showToast("Khong the xoa toan bo gio hang", "error");
    } finally {
      setClearing(false);
    }
  };

  if ((status === "idle" || (isAuthenticated && cartQuery.isLoading)) && items.length === 0) {
    return (
      <section className="bg-[#fafafa] min-h-[calc(100vh-160px)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse"
                >
                  <div className="h-28 rounded-xl bg-gray-100" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
              <div className="h-36 rounded-xl bg-gray-100" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="bg-[#fafafa] min-h-[calc(100vh-160px)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Gio hang dang trong</h1>
            <p className="mx-auto mb-8 max-w-xl text-sm text-gray-500 sm:text-base">
              Kham pha them san pham va them mon ban thich vao gio hang.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-xl bg-primeColor px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Tiep tuc mua sam
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#fafafa] min-h-[calc(100vh-160px)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Your cart
            </p>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Gio hang</h1>
            <p className="mt-2 text-sm text-gray-500">
              Ban dang co <span className="font-semibold text-gray-700">{totalQty}</span> san
              pham trong gio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Tiep tuc mua sam
            </Link>
            <button
              type="button"
              onClick={handleClearCart}
              disabled={clearing}
              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {clearing ? "Dang xoa..." : "Xoa toan bo"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item) => {
              const stockLimit =
                item.availableStock != null && item.availableStock >= 0
                  ? item.availableStock
                  : 999;
              const isSyncing = syncingId === item.cartItemId;

              return (
                <div
                  key={item.cartItemId}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                      to={`/shop/${item.product.slug}`}
                      className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-[#f6f4f1] sm:w-28"
                    >
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                          No image
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <Link
                            to={`/shop/${item.product.slug}`}
                            className="line-clamp-2 text-lg font-semibold text-gray-900 transition-colors hover:text-red-500"
                          >
                            {item.product.name}
                          </Link>
                          {(item.variantSku || item.variantSize || item.variantColor) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.variantSku && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                  SKU: {item.variantSku}
                                </span>
                              )}
                              {item.variantSize && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                  Size: {item.variantSize}
                                </span>
                              )}
                              {item.variantColor && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                  Mau: {item.variantColor}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-sm text-gray-500">Don gia</p>
                          <p className="text-lg font-bold text-red-500">
                            {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="mb-2 text-sm text-gray-500">So luong</p>
                          <div className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white">
                            <button
                              type="button"
                              onClick={() => handleDecrease(item.cartItemId, item.qty)}
                              disabled={isSyncing}
                              className="inline-flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-500 disabled:opacity-40"
                            >
                              -
                            </button>
                            <div className="inline-flex h-11 min-w-[52px] items-center justify-center border-x border-gray-200 px-3 text-sm font-semibold text-gray-800">
                              {item.qty}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleIncrease(item.cartItemId, item.qty, stockLimit)}
                              disabled={isSyncing || item.qty >= stockLimit}
                              className="inline-flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                          <div>
                            <p className="text-sm text-gray-500">Thanh tien</p>
                            <p className="text-xl font-bold text-gray-900">
                              {formatPrice(item.unitPrice * item.qty)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemove(item.cartItemId)}
                            disabled={isSyncing}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 sm:mt-3"
                          >
                            Xoa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-24">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Tom tat don hang</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Tam tinh</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Phi van chuyen</span>
                <span className="font-semibold text-gray-900">{formatPrice(shipping)}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">Tong cong</span>
                <span className="text-2xl font-bold text-red-500">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/checkout")}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-primeColor px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Tien hanh thanh toan
            </button>

            <Link
              to="/orders"
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-primeColor bg-white px-5 py-3.5 text-sm font-medium text-primeColor transition-colors hover:bg-primeColor hover:text-white"
            >
              Xem don hang cua toi
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
