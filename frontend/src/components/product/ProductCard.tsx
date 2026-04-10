import { useState } from "react";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  badge?: string;
  badgeVariant?: "hot" | "new" | "sale";
  stars: number;
  reviewCount: number;
  bgColor: string;
  cat: "all" | "women" | "men" | "acc";
}

interface Props {
  product: Product;
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`w-3.5 h-3.5 ${filled ? "text-warning" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ClothingIcon = () => (
  <svg width="100" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H5v10a2 2 0 002 2h10a2 2 0 002-2V10h1.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.34-2.23z" />
  </svg>
);

const badgeColors: Record<string, string> = {
  hot: "bg-primeColor",
  new: "bg-primeColor",
  sale: "bg-success",
};

export default function ProductCard({ product: p, onAddToCart, onBuyNow }: Props) {
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAdd = () => {
    onAddToCart(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className="group relative bg-white border border-gray-200 transition-all duration-350 hover:-translate-y-2.5 hover:shadow-cardHover hover:border-transparent w-full max-w-[320px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 380, background: p.bgColor }}>
        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          <ClothingIcon />
        </div>

        {/* Badge */}
        {p.badge && (
          <span
            className={`absolute top-3.5 left-3.5 text-white text-[11px] px-3 py-1.5 tracking-widest font-semibold z-10 rounded-sm shadow-md ${
              badgeColors[p.badgeVariant ?? "new"] ?? "bg-primeColor"
            }`}
          >
            {p.badge}
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={() => setWished(!wished)}
          className="absolute top-3.5 right-3.5 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center z-10 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-red-500 hover:border-red-500 shadow-md"
        >
          <svg
            className={`w-4 h-4 transition-colors ${wished ? "stroke-red-500 fill-red-500" : "stroke-gray-500 fill-none hover:stroke-white"}`}
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>

        {/* Quick view */}
        <div className="absolute bottom-0 inset-x-0 bg-primeColor/85 text-white text-xs tracking-widest py-3 text-center font-medium opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10 cursor-pointer">
          👁 XEM NHANH
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pt-5 pb-6">
        <p className="text-[11px] tracking-[1.5px] uppercase text-lightText mb-2 font-bodyFont">
          {p.category}
        </p>
        <h3 className="font-titleFont text-[18px] font-semibold leading-snug mb-3 line-clamp-2 min-h-[48px]">
          {p.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} filled={i < p.stars} />
          ))}
          <span className="text-xs text-lightText font-bodyFont ml-1.5">({p.reviewCount} đánh giá)</span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-red-500 font-titleFont">{p.price}</span>
            {p.oldPrice && (
              <span className="text-sm text-lightText line-through font-bodyFont">{p.oldPrice}</span>
            )}
          </div>
          {p.discount && (
            <span className="text-[12px] bg-yellow-100 text-yellow-800 px-2.5 py-1 font-semibold font-bodyFont rounded-sm">
              {p.discount}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {/* Nút Thêm giỏ hàng - nổi lên với shadow */}
          <button
            onClick={handleAdd}
            className={`flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-semibold font-bodyFont tracking-[0.6px] transition-all duration-250 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              added
                ? "bg-success text-white shadow-green-500/30"
                : "bg-white text-gray-800 border-2 border-gray-800 hover:bg-gray-800 hover:text-white shadow-gray-400/30"
            }`}
          >
            {added ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Đã thêm!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                Thêm giỏ hàng
              </>
            )}
          </button>

          {/* Nút Mua ngay - chữ màu đỏ */}
          <button
            onClick={() => onBuyNow(p)}
            className="flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-semibold font-bodyFont tracking-[0.6px] text-red-600 bg-red-50 border-2 border-red-600 transition-all duration-250 rounded-lg hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
}
