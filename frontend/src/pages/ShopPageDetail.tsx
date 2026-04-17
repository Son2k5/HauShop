import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProductBySlug } from "../hooks/useProduct";
import { useAppDispatch } from "../store/hooks";
import { setCartFromServer } from "../store/cartSlice";
import { addToCartApi, getMyCartApi } from "../services/cartService";
import { useToast } from "../context/toastContext";
import { formatPrice } from "../utils/formatPrice";
import type { ProductVariantSummaryDto } from "../@types/product.type";
import { useAuth } from "../hooks/useAuth";
import {
  createReviewApi,
  getProductReviewsApi,
  type ReviewDto,
} from "../services/reviewService";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { product, isLoading, isError, error } = useProductBySlug(slug);
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantSummaryDto | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!product) return;

    const activeVariants = product.variants.filter((v) => v.isActive);

    if (activeVariants.length === 1) {
      setSelectedVariant(activeVariants[0]);
    } else {
      setSelectedVariant(null);
    }

    setQty(1);
  }, [product]);

  if (isLoading) {
    return (
      <div className="max-w-container mx-auto px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="aspect-square bg-gray-100 animate-skeleton rounded-sm" />
          <div className="space-y-5">
            <div className="h-8 bg-gray-100 rounded w-2/3 animate-skeleton" />
            <div className="h-5 bg-gray-100 rounded w-1/3 animate-skeleton" />
            <div className="h-10 bg-gray-100 rounded w-1/4 animate-skeleton" />
            <div className="h-24 bg-gray-100 rounded animate-skeleton" />
            <div className="h-12 bg-gray-100 rounded animate-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-bodyFont">
          {error ?? "Không tìm thấy sản phẩm"}
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="btn-outline px-8 py-3 text-sm"
        >
          ← Quay lại Shop
        </button>
      </div>
    );
  }

  const activeVariants = product.variants.filter((v) => v.isActive);
  const hasVariants = activeVariants.length > 0;

  const currentVariant = selectedVariant ?? activeVariants[0] ?? null;
  const currentPrice = currentVariant?.price ?? product.minVariantPrice ?? product.price;
  const currentStock = currentVariant?.stock ?? 0;
  const isOutOfStock = currentStock <= 0;

  const mustChooseVariant = activeVariants.length > 1 && !selectedVariant;

  const handleAddToCart = async () => {
    if (!currentVariant) {
      showToast("Sản phẩm này chưa có phiên bản để thêm vào giỏ", "warning");
      return;
    }

    if (mustChooseVariant) {
      showToast("Vui lòng chọn phiên bản", "warning");
      return;
    }

    if (isOutOfStock) return;

    try {
      setAdding(true);

      await addToCartApi(currentVariant.id, qty);

      const cart = await getMyCartApi();
      dispatch(setCartFromServer(cart));

      setAddedToCart(true);
      showToast(`Đã thêm "${product.name}" vào giỏ!`, "success");
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error("Add to cart failed:", err);
      showToast("Không thể thêm vào giỏ hàng", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#f7f5f2] border-b border-gray-100 py-4 px-10">
        <nav className="max-w-container mx-auto flex items-center gap-2 text-sm text-lightText font-bodyFont">
          <Link to="/" className="hover:text-red-500 transition-colors">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/shop" className="hover:text-red-500 transition-colors">
            Shop
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-primeColor truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>
      </div>

      <div className="max-w-container mx-auto px-10 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="aspect-square bg-[#f7f5f2] flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                width="120"
                height="150"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="0.6"
              >
                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H5v10a2 2 0 002 2h10a2 2 0 002-2V10h1.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.34-2.23z" />
              </svg>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.brand && (
                <span className="text-[10px] tracking-[2px] uppercase font-semibold bg-primeColor text-white px-2.5 py-1 font-bodyFont">
                  {product.brand.name}
                </span>
              )}

              {product.categories.map((c) => (
                <span
                  key={c.id}
                  className="text-[10px] tracking-[1.5px] uppercase text-lightText font-bodyFont"
                >
                  {c.name}
                </span>
              ))}
            </div>

            <h1 className="font-titleFont text-3xl font-bold leading-tight mb-2">
              {product.name}
            </h1>

            <p className="text-xs text-lightText font-bodyFont mb-4">
              SKU: {currentVariant?.sku ?? product.sku}
            </p>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.averageRating)
                        ? "text-warning"
                        : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <span className="text-sm text-lightText font-bodyFont">
                ({product.averageRating.toFixed(1)})
              </span>
              <span className="text-gray-300">|</span>

              <span className="text-sm font-bodyFont">
                {isOutOfStock ? (
                  <span className="text-red-500 font-medium">Hết hàng</span>
                ) : (
                  <span className="text-success font-medium">
                    Còn {currentStock} sản phẩm
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-gray-100">
              <span className="font-titleFont text-3xl font-bold text-red-500">
                {formatPrice(currentPrice)}
              </span>

              {currentVariant && currentVariant.price < product.price && (
                <span className="text-lg text-lightText line-through font-bodyFont">
                  {formatPrice(product.price)}
                </span>
              )}

              {product.taxable && (
                <span className="text-xs text-lightText font-bodyFont">
                  (đã bao gồm thuế)
                </span>
              )}
            </div>

            {hasVariants && (
              <div className="mb-6">
                <p className="text-xs tracking-[2px] uppercase font-semibold mb-3 font-titleFont">
                  Phiên bản
                </p>

                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        setQty(1);
                      }}
                      disabled={v.stock <= 0}
                      className={`px-4 py-2 text-sm font-bodyFont border transition-all duration-200
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${
                          v.id === selectedVariant?.id ||
                          (activeVariants.length === 1 && v.id === currentVariant?.id)
                            ? "border-red-500 text-red-500 bg-red-50"
                            : "border-gray-200 hover:border-primeColor"
                        }`}
                    >
                      {v.sku}
                      <span className="ml-1.5 text-xs text-lightText">
                        {formatPrice(v.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-7">
              <p className="text-xs tracking-[2px] uppercase font-semibold font-titleFont">
                Số lượng
              </p>

              <div className="flex items-center border border-gray-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors text-lg"
                >
                  −
                </button>

                <span className="w-12 text-center text-sm font-bodyFont font-medium">
                  {qty}
                </span>

                <button
                  onClick={() => setQty((q) => Math.min(currentStock, q + 1))}
                  disabled={qty >= currentStock}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors text-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4
                  text-sm font-semibold font-bodyFont tracking-widest text-white
                  transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                  ${addedToCart ? "bg-success" : "bg-primeColor hover:bg-gray-700"}`}
              >
                {adding ? "Đang thêm..." : addedToCart ? "Đã thêm vào giỏ!" : "Thêm vào giỏ hàng"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock || adding}
                className="flex-1 flex items-center justify-center gap-2.5 py-4
                  text-sm font-semibold font-bodyFont tracking-widest text-white
                  bg-red-500 hover:bg-red-600 transition-all duration-300
                  hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mua ngay
              </button>
            </div>

            {product.description && (
              <div className="border-t border-gray-100 pt-6">
                <p className="text-xs tracking-[2px] uppercase font-semibold mb-3 font-titleFont">
                  Mô tả
                </p>
                <p className="text-sm text-lightText font-bodyFont leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <div className="border-t border-gray-100 mt-6 pt-5 space-y-1.5">
              {product.brand && (
                <p className="text-xs font-bodyFont text-lightText">
                  Thương hiệu:{" "}
                  <span className="text-primeColor font-medium">{product.brand.name}</span>
                </p>
              )}

              {product.categories.length > 0 && (
                <p className="text-xs font-bodyFont text-lightText">
                  Danh mục:{" "}
                  <span className="text-primeColor font-medium">
                    {product.categories.map((c) => c.name).join(", ")}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <ReviewSection
          productId={product.id}
          isAuthenticated={isAuthenticated}
          onRequireLogin={() => {
            showToast("Vui lòng đăng nhập để đánh giá sản phẩm", "warning");
            navigate("/signin");
          }}
        />
      </div>
    </div>
  );
}

function ReviewSection({
  productId,
  isAuthenticated,
  onRequireLogin,
}: {
  productId: string;
  isAuthenticated: boolean;
  onRequireLogin: () => void;
}) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getProductReviewsApi(productId, 1, 20);
      setReviews(data.items);
    } catch (error) {
      console.error("Load reviews failed:", error);
      showToast("Không thể tải đánh giá", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }

    try {
      setSubmitting(true);
      await createReviewApi({
        productId,
        rating,
        content: content.trim() || undefined,
      });

      setRating(5);
      setContent("");
      showToast("Đã gửi đánh giá của bạn", "success");
      await loadReviews();
    } catch (error: any) {
      console.error("Create review failed:", error);
      showToast(error?.response?.data?.message ?? "Không thể gửi đánh giá", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 border-t border-gray-100 pt-10">
      <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
        <div>
          <p className="text-xs tracking-[2px] uppercase font-semibold mb-3 font-titleFont">
            Đánh giá sản phẩm
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Số sao
              </label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`h-9 w-9 transition-colors ${
                        value <= rating ? "text-warning" : "text-gray-300"
                      }`}
                      aria-label={`${value} sao`}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nội dung
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                rows={5}
                className="w-full resize-none border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-red-400"
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              />
              <p className="mt-1 text-xs text-gray-400">{content.length}/2000</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primeColor px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </form>
        </div>

        <div>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse border border-gray-100 bg-gray-50" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="border border-gray-100 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
              Chưa có đánh giá nào cho sản phẩm này.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review.id} className="border border-gray-100 bg-white p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                        {review.userAvatar ? (
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          review.userName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{review.userName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.created).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <svg
                          key={index}
                          className={`h-4 w-4 ${
                            index < review.rating ? "text-warning" : "text-gray-200"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>

                  {review.content && (
                    <p className="text-sm leading-6 text-gray-600">{review.content}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
