import { useState, useEffect, useCallback } from "react";

interface Slide {
  id: number;
  tag: string;
  title: string;
  titleEm: string;
  titleEnd: string;
  sub: string;
  btnPrimary: string;
  btnSecondary: string;
  bgLeft: string;
  bgRight: string;
  imageUrl: string;
  dark?: boolean;
}

const slides: Slide[] = [
  {
    id: 1,
    tag: "Bộ sưu tập mới 2025",
    title: "Phong cách",
    titleEm: "Hiện đại",
    titleEnd: "Mỗi ngày",
    sub: "Khám phá những thiết kế được chọn lọc kỹ lưỡng cho cuộc sống hiện đại. Chất lượng thượng hạng, phong cách bền vững.",
    btnPrimary: "SHOP NOW",
    btnSecondary: "Xem Lookbook",
    bgLeft: "#f2ede6",
    bgRight: "#e8e0d5",
    imageUrl: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    tag: "Flash Sale — 50% OFF",
    title: "Ưu đãi",
    titleEm: "Khủng",
    titleEnd: "Hôm Nay",
    sub: "Đừng bỏ lỡ cơ hội sở hữu những món thời trang cao cấp với giá không tưởng. Giảm tới 50%.",
    btnPrimary: "SHOP SALE",
    btnSecondary: "Xem tất cả",
    bgLeft: "#111111",
    bgRight: "#1a1a1a",
    dark: true,
    imageUrl: "https://images.unsplash.com/photo-1441986300917-4c2308e4d8c4?w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    tag: "Accessories 2025",
    title: "Điểm nhấn",
    titleEm: "Hoàn hảo",
    titleEnd: "Cho bạn",
    sub: "Phụ kiện cao cấp tô điểm thêm cho phong cách. Từ túi xách đến trang sức, tất cả đều đỉnh.",
    btnPrimary: "SHOP NOW",
    btnSecondary: "Xem bộ sưu tập",
    bgLeft: "#f5eae8",
    bgRight: "#edd5cf",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop",
  },
];

const ArrowIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function HeroBanner() {
  const [cur, setCur] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const go = useCallback(
    (n: number) => {
      if (isAnimating) return;
      const next = ((n % slides.length) + slides.length) % slides.length;
      setDirection(next > cur ? 1 : -1);
      setIsAnimating(true);
      setCur(next);
      setTimeout(() => setIsAnimating(false), 900);
    },
    [cur, isAnimating]
  );

  useEffect(() => {
    const t = setInterval(() => go(cur + 1), 6000);
    return () => clearInterval(t);
  }, [cur, go]);

  const slide = slides[cur];

  return (
    <section className="relative w-full overflow-hidden" style={{ height: 650 }}>
      {/* Background với gradient transition */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{ background: slide.bgLeft }}
      />

      {/* Content Container */}
      <div className="relative z-10 h-full flex">
        {/* Left - Khung điền chữ (40%) */}
        <div
          key={`text-${slide.id}`}
          className="w-[40%] flex flex-col justify-center px-16 py-20"
          style={{
            animation: "fadeSlideIn 0.8s cubic-bezier(0.77,0,0.175,1) forwards",
          }}
        >
          <p
            className="text-xs tracking-[3.5px] uppercase font-semibold mb-5 font-titleFont"
            style={{ color: "#EF233C" }}
          >
            {slide.tag}
          </p>

          <h1
            className="font-titleFont font-bold leading-[1.08] mb-5"
            style={{ fontSize: "clamp(36px,4vw,56px)", color: slide.dark ? "#fff" : "#0d0d0d" }}
          >
            {slide.title}
            <br />
            <em className="not-italic" style={{ color: "#EF233C" }}>{slide.titleEm}</em>
            <br />
            {slide.titleEnd}
          </h1>

          <p
            className="text-sm leading-[1.75] max-w-md mb-10 font-bodyFont"
            style={{ color: slide.dark ? "rgba(255,255,255,0.7)" : "#666" }}
          >
            {slide.sub}
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              className="inline-flex items-center gap-3 px-10 py-4 text-sm font-semibold font-bodyFont tracking-widest transition-all duration-300 hover:-translate-y-1 group"
              style={{ background: "#EF233C", color: "#fff" }}
            >
              {slide.btnPrimary}
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </button>

            <button
              className="px-9 py-[15px] text-sm font-semibold font-bodyFont tracking-widest transition-all duration-300 hover:bg-opacity-10"
              style={{
                color: slide.dark ? "#fff" : "#0d0d0d",
                border: `1.5px solid ${slide.dark ? "rgba(255,255,255,0.4)" : "#0d0d0d"}`,
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = slide.dark ? "#fff" : "#0d0d0d";
                (e.currentTarget as HTMLButtonElement).style.color = slide.dark ? "#000" : "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = slide.dark ? "#fff" : "#0d0d0d";
              }}
            >
              {slide.btnSecondary}
            </button>
          </div>
        </div>

        {/* Right - Ảnh (60%) */}
        <div
          key={`img-${slide.id}`}
          className="w-[60%] relative overflow-hidden"
          style={{ background: slide.bgRight }}
        >
          {/* Decorative shapes */}
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-30"
            style={{ background: slide.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: slide.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
          />

          {/* Main image with animation - full width no padding */}
          <div
            className="absolute inset-0"
            style={{
              animation: direction > 0 ? "slideInRight 0.8s cubic-bezier(0.77,0,0.175,1) forwards" : "slideInLeft 0.8s cubic-bezier(0.77,0,0.175,1) forwards",
            }}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover"
            />

            {/* Overlay gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

            {/* Floating badge */}
            <div
              className="absolute top-6 right-6 px-5 py-2 rounded-full text-white text-sm font-semibold"
              style={{
                background: "#EF233C",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              {slide.id === 2 ? "-50% OFF" : "NEW"}
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-16 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="h-[3px] rounded-none transition-all duration-300"
            style={{
              width: i === cur ? 48 : 24,
              background: i === cur
                ? (slide.dark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)")
                : (slide.dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)"),
              border: "none",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Prev / Next */}
      <div className="absolute bottom-6 right-10 flex gap-2 z-20">
        {[{ dir: -1, d: "M15 18l-6-6 6-6" }, { dir: 1, d: "M9 18l6-6-6-6" }].map(({ dir, d }) => (
          <button
            key={dir}
            onClick={() => go(cur + dir)}
            className="w-11 h-11 flex items-center justify-center transition-all duration-200 hover:scale-110 rounded-full"
            style={{
              background: slide.dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.08)",
              border: `1px solid ${slide.dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)"}`,
            }}
          >
            <svg
              className="w-[17px] h-[17px]"
              fill="none"
              stroke={slide.dark ? "#fff" : "#333"}
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path d={d} />
            </svg>
          </button>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </section>
  );
}
