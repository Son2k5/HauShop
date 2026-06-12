import jacketImage from "../../assets/images/products/aokhoacnam4.webp";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { ROUTES } from "../../lib/routes";
import { Link } from "react-router-dom";

const stats = [
  { num: "50K+", label: "Khách hàng" },
  { num: "300+", label: "Thương hiệu" },
  { num: "4.9/5", label: "Đánh giá" },
];

export default function DarkStrip() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="grid min-h-[560px] grid-cols-1 overflow-hidden bg-primeColor lg:grid-cols-[0.86fr_1.14fr]">
      <div
        ref={ref}
        className={`flex flex-col justify-center px-6 py-14 transition-all duration-700 sm:px-10 lg:px-16 lg:py-16 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
      >
        <p className="mb-3.5 font-bodyFont text-[11px] font-semibold uppercase tracking-[3px] text-red-500">
          Tại sao chọn HAUSHOP?
        </p>
        <h2 className="mb-4 font-titleFont font-bold leading-[1.08] text-white" style={{ fontSize: "clamp(30px,3.7vw,48px)" }}>
          Thời trang
          <br />
          cho <em className="not-italic text-red-500">cuộc sống</em>
          <br />
          hiện đại
        </h2>
        <p className="mb-8 max-w-md font-bodyFont text-sm leading-[1.8] text-white/55">
          Mỗi sản phẩm được chọn lọc kỹ càng về chất lượng, phong cách và độ bền. Thời trang phải vừa đẹp vừa bền vững.
        </p>
        <div className="mb-10 flex flex-wrap gap-8">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-titleFont text-[28px] font-bold text-white">{s.num}</div>
              <div className="mt-0.5 font-bodyFont text-[11px] tracking-[0.5px] text-white/35">{s.label}</div>
            </div>
          ))}
        </div>
        <Link
          to={ROUTES.SHOP}
          className="group inline-flex self-start items-center gap-3 bg-red-500 px-10 py-4 font-bodyFont text-sm font-semibold tracking-widest text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(239,68,68,0.4)]"
        >
          MUA NGAY
          <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div
        className={`relative min-h-[500px] overflow-hidden bg-[#151515] transition-all duration-700 delay-200 lg:min-h-[560px] ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
      >
        <img
          src={jacketImage}
          alt="Premium Jacket"
          className="absolute inset-0 h-full w-full object-cover object-[center_58%] opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primeColor/85 via-primeColor/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute left-6 top-6 z-10 bg-red-500 px-4 py-2 font-bodyFont text-[10px] font-semibold tracking-[2px] text-white shadow-[0_18px_36px_rgba(239,68,68,0.24)] sm:left-10 sm:top-10">
          BEST SELLER 2025
        </div>
        <div className="relative z-10 flex h-full min-h-[500px] w-full items-end p-6 sm:p-10 lg:min-h-[560px] lg:p-12">
          <div className="max-w-md">
            <p className="font-titleFont text-[34px] font-bold leading-tight text-white sm:text-[46px]">
              Premium Jacket
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="font-bodyFont text-xl font-semibold text-white">299.000đ</p>
              <span className="bg-white px-3.5 py-1.5 font-bodyFont text-xs font-bold text-primeColor">
                -30%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
