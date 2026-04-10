import { useState } from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  const handleSubmit = () => {
    if (!email.includes("@")) return;
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="bg-[#f7f5f2] py-[72px] px-10 text-center">
      <div
        ref={ref}
        className={`max-w-xl mx-auto transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <p className="text-[11px] tracking-[3px] uppercase text-red-500 font-semibold mb-3 font-bodyFont">
          Đăng ký nhận tin
        </p>
        <h2 className="font-titleFont text-[34px] font-bold mb-2.5">
          Nhận ưu đãi độc quyền
        </h2>
        <p className="text-sm text-lightText font-bodyFont leading-[1.7] mb-8">
          Đăng ký để nhận thông báo về bộ sưu tập mới và ưu đãi đặc biệt.{" "}
          <span className="font-semibold text-primeColor">Tặng ngay 10%</span> cho đơn đầu tiên.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-success font-semibold font-bodyFont animate-scale-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Đăng ký thành công! Kiểm tra email nhé.
          </div>
        ) : (
          <div className="flex max-w-[440px] mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Nhập email của bạn"
              className="flex-1 px-5 py-3.5 border-[1.5px] border-gray-200 text-sm font-bodyFont outline-none focus:border-red-400 bg-white transition-colors"
            />
            <button
              onClick={handleSubmit}
              className="px-7 py-3.5 bg-red-500 text-white text-xs font-semibold font-bodyFont tracking-widest whitespace-nowrap hover:bg-red-600 transition-colors"
            >
              ĐĂNG KÝ
            </button>
          </div>
        )}
      </div>
    </section>
  );
}