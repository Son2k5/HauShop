import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import {
  getMyWishlistApi,
  removeWishlistProductApi,
  type WishlistItemDto,
} from "../services/wishlistService";
import { useToast } from "../context/toastContext";

export default function WishlistPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<WishlistItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingProductId, setRemovingProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyWishlistApi()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Fetch wishlist failed:", error);
          showToast("Không thể tải wishlist", "error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleRemove = async (productId: string) => {
    if (removingProductId) return;

    try {
      setRemovingProductId(productId);
      await removeWishlistProductApi(productId);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      showToast("Đã xóa khỏi wishlist", "success");
    } catch (error) {
      console.error("Remove wishlist item failed:", error);
      showToast("Không thể xóa sản phẩm", "error");
    } finally {
      setRemovingProductId(null);
    }
  };

  if (loading) {
    return (
      <section className="min-h-[calc(100vh-160px)] bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[480px] animate-pulse bg-white border border-gray-200" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-160px)] bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Wishlist
            </p>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Sản phẩm yêu thích
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Bạn đang có <span className="font-semibold text-gray-700">{items.length}</span> sản phẩm trong wishlist.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Tiếp tục mua sắm
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Wishlist đang trống
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-sm text-gray-500 sm:text-base">
              Hãy thêm những sản phẩm bạn thích để xem lại nhanh hơn.
            </p>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-xl bg-primeColor px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id}>
                <ProductCard product={item.product} />
                <button
                  onClick={() => handleRemove(item.productId)}
                  disabled={removingProductId === item.productId}
                  className="mt-3 w-full border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removingProductId === item.productId ? "Đang xóa..." : "Xóa khỏi wishlist"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
