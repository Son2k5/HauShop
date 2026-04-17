import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearCart, removeItem, setCartFromServer, updateQty } from "../store/cartSlice";
import {
  clearCartApi,
  getMyCartApi,
  removeCartItemApi,
  updateCartItemApi,
} from "../services/cartService";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../context/toastContext";

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const { items, totalQty, subtotal } = useAppSelector((state) => state.cart);

  const [isLoading, setIsLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await getMyCartApi();
        dispatch(setCartFromServer(data));
      } catch (error) {
        console.error("Fetch cart failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [dispatch]);

  const shipping = useMemo(() => (items.length > 0 ? 30000 : 0), [items.length]);
  const total = subtotal + shipping;

  const handleDecrease = async (
    cartItemId: string | undefined,
    productId: string,
    currentQty: number,
    variantId?: string
  ) => {
    const nextQty = currentQty - 1;

    // If no cartItemId, just update local cart (not synced yet)
    if (!cartItemId) {
      if (nextQty <= 0) {
        dispatch(removeItem({ productId, variantId }));
      } else {
        dispatch(updateQty({ productId, qty: nextQty, variantId }));
      }
      return;
    }

    try {
      setSyncingId(cartItemId);

      if (nextQty <= 0) {
        const updatedCart = await removeCartItemApi(cartItemId);
        dispatch(setCartFromServer(updatedCart));
      } else {
        const updatedCart = await updateCartItemApi(cartItemId, nextQty);
        dispatch(setCartFromServer(updatedCart));
      }
    } catch (error) {
      console.error("Decrease cart item failed:", error);
      showToast("Không thể cập nhật giỏ hàng", "error");
    } finally {
      setSyncingId(null);
    }
  };

  const handleIncrease = async (
    cartItemId: string | undefined,
    productId: string,
    currentQty: number,
    maxQty: number,
    variantId?: string
  ) => {
    if (currentQty >= maxQty) return;

    const nextQty = currentQty + 1;

    // If no cartItemId, just update local cart (not synced yet)
    if (!cartItemId) {
      dispatch(updateQty({ productId, qty: nextQty, variantId }));
      return;
    }

    try {
      setSyncingId(cartItemId);
      const updatedCart = await updateCartItemApi(cartItemId, nextQty);
      dispatch(setCartFromServer(updatedCart));
    } catch (error) {
      console.error("Increase cart item failed:", error);
      showToast("Không thể cập nhật giỏ hàng", "error");
    } finally {
      setSyncingId(null);
    }
  };

  const handleRemove = async (
    cartItemId: string | undefined,
    productId: string,
    variantId?: string
  ) => {
    // If no cartItemId, just remove from local cart (not synced yet)
    if (!cartItemId) {
      dispatch(removeItem({ productId, variantId }));
      showToast("Đã xóa sản phẩm khỏi giỏ hàng", "success");
      return;
    }

    try {
      setSyncingId(cartItemId);
      const updatedCart = await removeCartItemApi(cartItemId);
      dispatch(setCartFromServer(updatedCart));
      showToast("Đã xóa sản phẩm khỏi giỏ hàng", "success");
    } catch (error) {
      console.error("Remove cart item failed:", error);
      showToast("Không thể xóa sản phẩm", "error");
    } finally {
      setSyncingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!items.length) return;

    const confirmed = window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?");
    if (!confirmed) return;

    try {
      setClearing(true);
      await clearCartApi();
      dispatch(clearCart());
      showToast("Đã xóa toàn bộ giỏ hàng", "success");
    } catch (error) {
      console.error("Clear cart failed:", error);
      showToast("Không thể xóa toàn bộ giỏ hàng", "error");
    } finally {
      setClearing(false);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-[#fafafa] min-h-[calc(100vh-160px)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="h-28 w-28 rounded-2xl bg-gray-100" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-24 rounded bg-gray-100" />
                      <div className="h-6 w-2/3 rounded bg-gray-100" />
                      <div className="h-4 w-32 rounded bg-gray-100" />
                      <div className="h-10 w-36 rounded bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
              <div className="h-5 w-32 rounded bg-gray-100 mb-6" />
              <div className="space-y-4">
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-10 w-full rounded bg-gray-100" />
              </div>
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
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-10 w-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.7}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 17v4"
                />
              </svg>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-gray-900">Giỏ hàng của bạn đang trống</h1>
            <p className="mx-auto mb-8 max-w-xl text-sm text-gray-500 sm:text-base">
              Hãy khám phá thêm sản phẩm và thêm những món bạn yêu thích vào giỏ hàng.
            </p>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-xl bg-primeColor px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Tiếp tục mua sắm
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
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Giỏ hàng</h1>
            <p className="mt-2 text-sm text-gray-500">
              Bạn đang có <span className="font-semibold text-gray-700">{totalQty}</span> sản phẩm
              trong giỏ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Tiếp tục mua sắm
            </Link>

            <button
              onClick={handleClearCart}
              disabled={clearing}
              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {clearing ? "Đang xóa..." : "Xóa toàn bộ"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item: any, index: number) => {
              const stockLimit =
                item.product?.totalStock != null && item.product.totalStock >= 0
                  ? item.product.totalStock
                  : 999;

              const isSyncing = syncingId === item.cartItemId;

              return (
                <div
                  key={item.cartItemId || `${item.product?.id}-${item.variantId ?? "default"}-${index}`}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                      to={`/shop/${item.product.slug}`}
                      className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-[#f6f4f1] sm:h-28 sm:w-28"
                    >
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg
                            className="h-10 w-10 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.2}
                              d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H5v10a2 2 0 002 2h10a2 2 0 002-2V10h1.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.34-2.23z"
                            />
                          </svg>
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                            {item.product.brandName ??
                              item.product.categories?.[0]?.name ??
                              "HAUSHOP"}
                          </p>

                          <Link
                            to={`/shop/${item.product.slug}`}
                            className="line-clamp-2 text-lg font-semibold text-gray-900 transition-colors hover:text-red-500"
                          >
                            {item.product.name}
                          </Link>

                          {(item.variantSku || item.variantId) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.variantSku && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                  SKU: {item.variantSku}
                                </span>
                              )}
                              {item.variantId && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                  Variant
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-sm text-gray-500">Đơn giá</p>
                          <p className="text-lg font-bold text-red-500">
                            {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="mb-2 text-sm text-gray-500">Số lượng</p>

                          <div className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white">
                            <button
                              onClick={() =>
                                handleDecrease(
                                  item.cartItemId,
                                  item.product.id,
                                  item.qty,
                                  item.variantId
                                )
                              }
                              disabled={isSyncing}
                              className="inline-flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-500 disabled:opacity-40"
                              aria-label="Decrease quantity"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                            </button>

                            <div className="inline-flex h-11 min-w-[52px] items-center justify-center border-x border-gray-200 px-3 text-sm font-semibold text-gray-800">
                              {item.qty}
                            </div>

                            <button
                              onClick={() =>
                                handleIncrease(
                                  item.cartItemId,
                                  item.product.id,
                                  item.qty,
                                  stockLimit,
                                  item.variantId
                                )
                              }
                              disabled={isSyncing || item.qty >= stockLimit}
                              className="inline-flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>

                          <p className="mt-2 text-xs text-gray-400">
                            Tối đa: {stockLimit > 999 ? "Không giới hạn" : stockLimit}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                          <div>
                            <p className="text-sm text-gray-500">Thành tiền</p>
                            <p className="text-xl font-bold text-gray-900">
                              {formatPrice(item.unitPrice * item.qty)}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              handleRemove(item.cartItemId, item.product.id, item.variantId)
                            }
                            disabled={isSyncing}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 sm:mt-3"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.9}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-24">
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Order summary
              </p>
              <h2 className="text-2xl font-bold text-gray-900">Tóm tắt đơn hàng</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Tạm tính</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-gray-900">{formatPrice(shipping)}</span>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">Tổng cộng</span>
                <span className="text-2xl font-bold text-red-500">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-primeColor px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Tiến hành thanh toán
            </button>

            <Link
              to="/orders"
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-primeColor bg-white px-5 py-3.5 text-sm font-medium text-primeColor transition-colors hover:bg-primeColor hover:text-white"
            >
              Xem đơn hàng của tôi
            </Link>

            <Link
              to="/shop"
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Mua thêm sản phẩm
            </Link>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Ghi chú</p>
              <p className="mt-1 text-xs leading-6 text-gray-500">
                Giá và tồn kho trong giỏ hàng chỉ mang tính tham khảo. Hệ thống sẽ kiểm tra lại
                chính xác ở bước thanh toán.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
