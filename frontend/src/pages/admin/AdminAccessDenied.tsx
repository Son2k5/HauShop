import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

export default function AdminAccessDenied() {
  return (
    <div className="min-h-screen bg-[#fff8f0] px-6 py-16 text-[#342110]">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-[#f4d3ae] bg-white p-10 shadow-[0_30px_80px_rgba(231,146,24,0.08)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#fff2df] text-[#d97904]">
          <Icon icon="mdi:shield-alert-outline" width={34} />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-[#d97904]">
          Admin Access
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight">
          Bạn không có quyền truy cập khu vực quản trị.
        </h1>
        <p className="mt-4 text-base leading-7 text-[#6d5133]">
          Tài khoản hiện tại không phải Admin
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-[#f28c18] px-5 py-3 font-semibold text-white transition hover:bg-[#db7f16]"
          >
            <Icon icon="mdi:home-outline" width={18} className="mr-2" />
            Về trang chủ
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center rounded-full border border-[#edc79b] px-5 py-3 font-semibold text-[#7d4f1f] transition hover:bg-[#fff2e0]"
          >
            <Icon icon="mdi:account-circle-outline" width={18} className="mr-2" />
            Xem hồ sơ
          </Link>
        </div>
      </div>
    </div>
  );
}
