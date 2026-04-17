import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/toastContext";
import { formatPrice } from "../../utils/formatPrice";
import { useAppDispatch } from "../../store/hooks";
import { setCartFromServer } from "../../store/cartSlice";
import type { ProductSummaryDto } from "../../@types/product.type";
import { addToCartApi, getMyCartApi } from "../../services/cartService";
import {
  addWishlistItemApi,
  isWishlistProductApi,
  removeWishlistProductApi,
} from "../../services/wishlistService";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  product: ProductSummaryDto;
}

function displayPrice(p: ProductSummaryDto): number {
  return p.minVariantPrice != null && p.minVariantPrice < p.price
    ? p.minVariantPrice
    : p.price;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-3.5 h-3.5 ${filled ? "text-warning" : "text-gray-300"}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function ProductCard({ product: p }: Props) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [adding, setAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const price = displayPrice(p);
  const isOutOfStock = p.totalStock != null && p.totalStock <= 0;

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setWished(false);
      return;
    }

    isWishlistProductApi(p.id)
      .then((exists) => {
        if (!cancelled) setWished(exists);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Check wishlist failed:", error);
          setWished(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, p.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOutOfStock || adding) return;

    try {
      setAdding(true);

      if (!p.defaultVariantId) {
        navigate(`/shop/${p.slug}`);
        return;
      }

      await addToCartApi(p.defaultVariantId, 1);

      const cart = await getMyCartApi();
      dispatch(setCartFromServer(cart));

      setAdded(true);
      showToast(`Đã thêm "${p.name}" vào giỏ!`, "success");
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error("Add to cart failed:", error);
      showToast("Không thể thêm vào giỏ hàng", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/shop/${p.slug}`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast("Vui lòng đăng nhập để dùng wishlist", "warning");
      navigate("/signin");
      return;
    }

    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);

      if (wished) {
        await removeWishlistProductApi(p.id);
        setWished(false);
        showToast("Đã xóa khỏi yêu thích", "success");
      } else {
        await addWishlistItemApi(p.id);
        setWished(true);
        showToast("Đã thêm vào yêu thích", "success");
      }
    } catch (error) {
      console.error("Wishlist failed:", error);
      showToast("Không thể cập nhật wishlist", "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/shop/${p.slug}`)}
      className="group relative bg-white border border-gray-200 cursor-pointer
                 transition-all duration-350
                 hover:-translate-y-2.5 hover:shadow-cardHover hover:border-transparent"
    >
      <div className="relative overflow-hidden bg-[#f7f5f2]" style={{ height: 320 }}>
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="90"
              height="110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="0.8"
            >
              <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H5v10a2 2 0 002 2h10a2 2 0 002-2V10h1.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.34-2.23z" />
            </svg>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <span className="text-xs font-semibold tracking-widest text-gray-500 border border-gray-300 px-3 py-1.5">
              HẾT HÀNG
            </span>
          </div>
        )}

        {!isOutOfStock && p.categories[0] && (
          <span className="absolute top-3.5 left-3.5 bg-primeColor text-white text-[10px] px-3 py-1 tracking-widest font-semibold z-10">
            {p.categories[0].name.toUpperCase()}
          </span>
        )}

        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="absolute top-3.5 right-3.5 w-9 h-9 bg-white border border-gray-200 rounded-full
                     flex items-center justify-center z-10
                     opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0
                     transition-all duration-300 hover:bg-red-500 hover:border-red-500
                     disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={wished ? "Xóa khỏi wishlist" : "Thêm vào wishlist"}
        >
          <svg
            className={`w-4 h-4 transition-all ${
              wished ? "fill-red-500 stroke-red-500" : "fill-none stroke-gray-500"
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>

        <div className="absolute bottom-0 inset-x-0 bg-primeColor/85 text-white text-xs
                        tracking-widest py-3 text-center font-medium z-10
                        opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-300">
          XEM NHANH
        </div>
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="text-[10px] tracking-[1.5px] uppercase text-lightText mb-1.5 font-bodyFont truncate">
          {p.brandName ?? p.categories[0]?.name ?? "HAUSHOP"}
        </p>

        <h3 className="font-titleFont text-[17px] font-semibold leading-snug mb-2 truncate">
          {p.name}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} filled={i < Math.round(p.averageRating || 4)} />
          ))}
          <span className="text-xs text-lightText font-bodyFont ml-1">
            ({p.reviewCount || 128})
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[20px] font-bold text-red-500 font-titleFont">
              {formatPrice(price)}
            </span>
            {p.minVariantPrice != null && p.minVariantPrice < p.price && (
              <span className="text-sm text-lightText line-through font-bodyFont">
                {formatPrice(p.price)}
              </span>
            )}
          </div>

          {p.totalStock != null && p.totalStock <= 10 && p.totalStock > 0 && (
            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 font-semibold font-bodyFont">
              Còn {p.totalStock}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className={`flex items-center justify-center gap-2 py-3 text-xs font-semibold
                        font-bodyFont tracking-[0.6px] text-white transition-all duration-250
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${added ? "bg-success" : "bg-primeColor hover:bg-gray-700"}`}
          >
            {adding ? (
              "Đang thêm..."
            ) : added ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Đã thêm!
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                Thêm giỏ hàng
              </>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            className="flex items-center justify-center gap-2 py-3 text-xs font-semibold
                       font-bodyFont tracking-[0.6px] text-white bg-red-500
                       transition-all duration-250 hover:bg-red-600 hover:-translate-y-0.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
}
