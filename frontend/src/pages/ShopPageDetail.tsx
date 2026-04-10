import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductBySlug } from "../hooks/useProduct";
import { useCartContext } from "../context/cartContext";
import { useToast } from "../context/toastContext";
import { formatPrice } from "../utils/formatPrice";
import type { ProductVariantSummaryDto } from "../@types/product.type";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { product, isLoading, isError, error } = useProductBySlug(slug);
  const { addItem } = useCartContext();
  const { showToast } = useToast();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariantSummaryDto | null>(null);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // ── Loading skeleton ──────────────────────────────────────────────────────
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

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-bodyFont">{error ?? "Không tìm thấy sản phẩm"}</p>
        <button onClick={() => navigate("/shop")} className="btn-outline px-8 py-3 text-sm">
          ← Quay lại Shop
        </button>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const activeVariants = product.variants.filter((v) => v.isActive);
  const currentPrice = selectedVariant?.price ?? product.minVariantPrice ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.totalStock;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.categories[0]?.name ?? "",
        categorySlug: product.categories[0]?.slug ?? "",
        price: currentPrice,
        images: product.imageUrl ? [product.imageUrl] : [],
        bgColor: "#f7f5f2",
        inStock: !isOutOfStock,
        stars: 5,
        reviewCount: 0,
      } as never,
      undefined,
      undefined
    );
    setAddedToCart(true);
    showToast(`Đã thêm "${product.name}" vào giỏ!`, "success");
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="bg-[#f7f5f2] border-b border-gray-100 py-4 px-10">
        <nav className="max-w-container mx-auto flex items-center gap-2 text-sm text-lightText font-bodyFont">
          <a href="/" className="hover:text-red-500 transition-colors">Home</a>
          <span className="text-gray-300">/</span>
          <a href="/shop" className="hover:text-red-500 transition-colors">Shop</a>
          <span className="text-gray-300">/</span>
          <span className="text-primeColor truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-container mx-auto px-10 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* ── Image ─────────────────────────────────────────────────── */}
          <div className="aspect-square bg-[#f7f5f2] flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg width="120" height="150" viewBox="0 0 24 24" fill="none"
                   stroke="rgba(0,0,0,0.1)" strokeWidth="0.6">
                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H5v10a2 2 0 002 2h10a2 2 0 002-2V10h1.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.34-2.23z" />
              </svg>
            )}
          </div>

          {/* ── Info ──────────────────────────────────────────────────── */}
          <div className="flex flex-col">

            {/* Brand + Categories */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.brand && (
                <span className="text-[10px] tracking-[2px] uppercase font-semibold
                                 bg-primeColor text-white px-2.5 py-1 font-bodyFont">
                  {product.brand.name}
                </span>
              )}
              {product.categories.map((c) => (
                <span key={c.id} className="text-[10px] tracking-[1.5px] uppercase text-lightText font-bodyFont">
                  {c.name}
                </span>
              ))}
            </div>

            {/* Name */}
            <h1 className="font-titleFont text-3xl font-bold leading-tight mb-2">
              {product.name}
            </h1>

            {/* SKU */}
            <p className="text-xs text-lightText font-bodyFont mb-4">SKU: {product.sku}</p>

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < 4 ? "text-warning" : "text-gray-200"}`}
                       fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-lightText font-bodyFont">(4.0)</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-bodyFont">
                {isOutOfStock
                  ? <span className="text-red-500 font-medium">Hết hàng</span>
                  : <span className="text-success font-medium">Còn {currentStock} sản phẩm</span>}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-gray-100">
              <span className="font-titleFont text-3xl font-bold text-red-500">
                {formatPrice(currentPrice)}
              </span>
              {selectedVariant && selectedVariant.price < product.price && (
                <span className="text-lg text-lightText line-through font-bodyFont">
                  {formatPrice(product.price)}
                </span>
              )}
              {product.taxable && (
                <span className="text-xs text-lightText font-bodyFont">(đã bao gồm thuế)</span>
              )}
            </div>

            {/* Variants */}
            {activeVariants.length > 0 && (
              <div className="mb-6">
                <p className="text-xs tracking-[2px] uppercase font-semibold mb-3 font-titleFont">
                  Phiên bản
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id === selectedVariant?.id ? null : v)}
                      disabled={v.stock <= 0}
                      className={`px-4 py-2 text-sm font-bodyFont border transition-all duration-200
                                  disabled:opacity-40 disabled:cursor-not-allowed
                                  ${v.id === selectedVariant?.id
                                    ? "border-red-500 text-red-500 bg-red-50"
                                    : "border-gray-200 hover:border-primeColor"}`}
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

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-7">
              <p className="text-xs tracking-[2px] uppercase font-semibold font-titleFont">Số lượng</p>
              <div className="flex items-center border border-gray-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-bodyFont font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(currentStock, q + 1))}
                  disabled={qty >= currentStock}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50
                             transition-colors text-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4
                            text-sm font-semibold font-bodyFont tracking-widest text-white
                            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                            ${addedToCart ? "bg-success" : "bg-primeColor hover:bg-gray-700"}`}
              >
                {addedToCart ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Đã thêm vào giỏ!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                    Thêm vào giỏ hàng
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 flex items-center justify-center gap-2.5 py-4
                           text-sm font-semibold font-bodyFont tracking-widest text-white
                           bg-red-500 hover:bg-red-600 transition-all duration-300
                           hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Mua ngay
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-gray-100 pt-6">
                <p className="text-xs tracking-[2px] uppercase font-semibold mb-3 font-titleFont">Mô tả</p>
                <p className="text-sm text-lightText font-bodyFont leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Meta */}
            <div className="border-t border-gray-100 mt-6 pt-5 space-y-1.5">
              {product.brand && (
                <p className="text-xs font-bodyFont text-lightText">
                  Thương hiệu: <span className="text-primeColor font-medium">{product.brand.name}</span>
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
      </div>
    </div>
  );
}