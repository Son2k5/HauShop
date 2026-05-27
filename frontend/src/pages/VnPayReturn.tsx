import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../context/toastContext";
import { http } from "../lib/http";
import { logger } from "../lib/logger";

export default function VnPayReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processReturn = async () => {
      try {
        const queryString = location.search || "";
        const order = await http.get<{ id: string }>(`/order/vnpay-return${queryString}`);

        showToast("Thanh toán VNPay đã được xử lý", "success");
        navigate(`/orders/${order.id}`, { replace: true });
      } catch (err: any) {
        logger.error("VNPay return failed", err);
        showToast(err?.response?.data?.message || "Xử lý thanh toán thất bại", "error");
        navigate("/orders", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    processReturn();
  }, [location.search, navigate, showToast]);

  return (
    <div className="max-w-container mx-auto px-10 py-20 text-center">
      <h1 className="text-2xl font-bold font-titleFont mb-4">Đang xử lý thanh toán...</h1>
      <p className="text-lightText">
        {loading ? "Vui lòng chờ trong giây lát." : "Đang chuyển hướng..."}
      </p>
    </div>
  );
}
