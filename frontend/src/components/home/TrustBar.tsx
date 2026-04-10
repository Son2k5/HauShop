import { useScrollReveal } from "../../hooks/useScrollReveal";

const items = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#EF233C" strokeWidth="1.5" className="w-6 h-6">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Giao hàng nhanh",
    sub: "Miễn phí đơn từ 500K, giao trong 2–3 ngày.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#EF233C" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Thanh toán bảo mật",
    sub: "Hỗ trợ MoMo, VNPAY, Visa & Mastercard.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#EF233C" strokeWidth="1.5" className="w-6 h-6">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
      </svg>
    ),
    title: "Đổi trả 30 ngày",
    sub: "Không hài lòng? Đổi trả miễn phí.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#EF233C" strokeWidth="1.5" className="w-6 h-6">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: "Hỗ trợ 24/7",
    sub: "Tư vấn viên luôn sẵn sàng mọi lúc.",
  },
];

const TrustBar = () => {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="bg-[#f7f5f2] py-12 px-10">
      <div
        ref={ref}
        className="max-w-container mx-auto grid grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {items.map((item, i) => (
          <div
            key={i}
            className={`text-center px-4 py-7 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="w-11 h-11 mx-auto mb-3.5 flex items-center justify-center">
              {item.icon}
            </div>
            <p className="text-sm font-semibold font-titleFont mb-1.5">{item.title}</p>
            <p className="text-xs text-lightText font-bodyFont leading-relaxed">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustBar;