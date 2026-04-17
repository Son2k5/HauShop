import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Slide {
  id: number;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  imageUrl: string;
  badge: string;
}

const slides: Slide[] = [
  {
    id: 1,
    eyebrow: "Bộ sưu tập mới 2026",
    title: "Phong cách hiện đại",
    highlight: "cho mỗi ngày",
    subtitle:
      "Khám phá các thiết kế dễ mặc, phom dáng gọn gàng và chất liệu phù hợp với nhịp sống năng động.",
    primaryLabel: "Mua sắm ngay",
    primaryHref: "/shop?search=Áo",
    secondaryLabel: "Xem tất cả",
    secondaryHref: "/shop",
    imageUrl:
      "https://images.unsplash.com/photo-1764698192249-641a17d7a4fe?w=1800&auto=format&fit=crop&q=85",
    badge: "NEW",
  },
  {
    id: 2,
    eyebrow: "Flash Sale - 50% OFF",
    title: "Outfit nổi bật",
    highlight: "giá tốt hôm nay",
    subtitle:
      "Săn nhanh áo khoác, sneaker và phụ kiện đang được yêu thích với ưu đãi tốt trong thời gian giới hạn.",
    primaryLabel: "Xem ưu đãi",
    primaryHref: "/shop?search=Sneaker",
    secondaryLabel: "Sản phẩm mới",
    secondaryHref: "/shop?search=Áo%20khoác",
    imageUrl:
      "https://images.unsplash.com/photo-1763935724017-471cbc57d105?w=1800&auto=format&fit=crop&q=85",
    badge: "-50%",
  },
  {
    id: 3,
    eyebrow: "Phụ kiện chọn lọc",
    title: "Hoàn thiện outfit",
    highlight: "theo cách riêng",
    subtitle:
      "Balo, túi xách và đồng hồ giúp bạn tạo điểm nhấn rõ ràng mà vẫn dễ phối với trang phục hằng ngày.",
    primaryLabel: "Mua phụ kiện",
    primaryHref: "/shop?search=Balo",
    secondaryLabel: "Xem bộ sưu tập",
    secondaryHref: "/shop?search=Phụ%20kiện",
    imageUrl:
      "https://images.unsplash.com/photo-1765815442424-5acf90d01e41?w=1800&auto=format&fit=crop&q=85",
    badge: "STYLE",
  },
];

const ArrowIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback(
    (nextIndex: number) => {
      if (isAnimating) return;

      const next = ((nextIndex % slides.length) + slides.length) % slides.length;
      setIsAnimating(true);
      setCurrent(next);
      window.setTimeout(() => setIsAnimating(false), 650);
    },
    [isAnimating]
  );

  useEffect(() => {
    const timer = window.setInterval(() => goToSlide(current + 1), 6500);
    return () => window.clearInterval(timer);
  }, [current, goToSlide]);

  const slide = slides[current];

  return (
    <section className="relative min-h-[560px] overflow-hidden bg-black lg:min-h-[680px]">
      <div key={slide.id} className="absolute inset-0">
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="h-full w-full object-cover"
          loading={slide.id === 1 ? "eager" : "lazy"}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.48)_42%,rgba(0,0,0,0.12)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[560px] max-w-container items-center px-4 py-16 sm:px-6 lg:min-h-[680px] lg:px-10">
        <div
          key={`copy-${slide.id}`}
          className="max-w-2xl text-white"
          style={{
            animation: "heroCopyIn 0.6s ease-out forwards",
          }}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[3px] text-red-400">
            {slide.eyebrow}
          </p>

          <h1 className="font-titleFont text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {slide.title}
            <span className="mt-2 block text-red-400">{slide.highlight}</span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
            {slide.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to={slide.primaryHref}
              className="inline-flex items-center justify-center gap-3 rounded-md bg-red-500 px-7 py-3.5 text-sm font-semibold tracking-[0.08em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-600"
            >
              {slide.primaryLabel}
              <ArrowIcon />
            </Link>

            <Link
              to={slide.secondaryHref}
              className="inline-flex items-center justify-center rounded-md border border-white/55 px-7 py-3.5 text-sm font-semibold tracking-[0.08em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-black"
            >
              {slide.secondaryLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-7 left-4 z-20 flex gap-2 sm:left-6 lg:left-[calc((100%-1280px)/2+40px)]">
        {slides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goToSlide(index)}
            className="h-[3px] rounded-full transition-all duration-300"
            style={{
              width: index === current ? 46 : 24,
              background: index === current ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.35)",
            }}
            aria-label={`Chuyển đến banner ${index + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-6 right-4 z-20 flex gap-2 sm:right-6 lg:right-10">
        <button
          type="button"
          onClick={() => goToSlide(current - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white transition-all duration-200 hover:bg-white hover:text-black"
          aria-label="Banner trước"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => goToSlide(current + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white transition-all duration-200 hover:bg-white hover:text-black"
          aria-label="Banner tiếp theo"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="absolute right-4 top-5 z-20 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold tracking-[0.14em] text-white sm:right-6 lg:right-10">
        {slide.badge}
      </div>

      <style>{`
        @keyframes heroCopyIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
