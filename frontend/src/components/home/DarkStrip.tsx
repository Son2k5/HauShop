import { useScrollReveal } from "../../hooks/useScrollReveal";

const stats = [
  { num: "50K+", label: "Khách hàng" },
  { num: "300+", label: "Thương hiệu" },
  { num: "4.9★", label: "Đánh giá" },
];

export default function DarkStrip() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="bg-primeColor grid grid-cols-1 lg:grid-cols-2 min-h-[440px]">
      {/* Left */}
      <div
        ref={ref}
        className={`flex flex-col justify-center px-16 py-16 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
      >
        <p className="text-[11px] tracking-[3px] uppercase text-red-500 font-semibold mb-3.5 font-bodyFont">
          Tại sao chọn HAUSHOP?
        </p>
        <h2 className="font-titleFont font-bold text-white leading-[1.1] mb-3.5" style={{ fontSize: "clamp(28px,3.5vw,44px)" }}>
          Thời trang<br />
          cho <em className="not-italic text-red-500">cuộc sống</em><br />
          hiện đại
        </h2>
        <p className="text-sm text-white/50 font-bodyFont leading-[1.8] mb-8 max-w-md">
          Mỗi sản phẩm được chọn lọc kỹ càng về chất lượng, phong cách và độ bền. Thời trang phải vừa đẹp vừa bền vững.
        </p>
        <div className="flex gap-8 mb-10">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-titleFont text-[28px] font-bold text-white">{s.num}</div>
              <div className="text-[11px] text-white/35 tracking-[0.5px] mt-0.5 font-bodyFont">{s.label}</div>
            </div>
          ))}
        </div>
        <button className="self-start inline-flex items-center gap-3 px-10 py-4 bg-red-500 text-white text-sm font-semibold font-bodyFont tracking-widest transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(239,68,68,0.4)] group">
          SHOP NOW
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Right — floating card */}
      <div
        className={`bg-[#181818] flex items-center justify-center overflow-hidden transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
      >
        <div className="relative bg-[#242424] w-64 px-6 py-8 text-center animate-float" style={{ transform: "rotate(-1deg)" }}>
          <div className="absolute top-0 inset-x-0 bg-red-500 text-white text-[9px] py-1.5 tracking-[2px] font-semibold font-bodyFont">
            BEST SELLER 2025
          </div>
          <div className="w-[90px] h-[110px] bg-[#2e2e2e] mx-auto mt-7 mb-3.5 flex items-center justify-center">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1">
              <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H5v10a2 2 0 002 2h10a2 2 0 002-2V10h1.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.34-2.23z" />
            </svg>
          </div>
          <p className="font-titleFont text-white text-[15px] mb-1.5">Premium Jacket</p>
          <p className="text-red-500 text-xs font-medium font-bodyFont">2.499.000₫</p>
          <div className="absolute -bottom-2.5 right-5 bg-red-500 text-white text-xs px-3.5 py-1.5 font-semibold font-bodyFont">
            -30%
          </div>
        </div>
      </div>
    </section>
  );
}