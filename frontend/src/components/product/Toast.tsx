import { useEffect, useState } from "react";

interface Props {
  message: string;
  show: boolean;
  type?: "cart" | "buy" | "wish";
}

export default function Toast({ message, show, type = "cart" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2800);
      return () => clearTimeout(t);
    }
  }, [show, message]);

  const iconColor = type === "wish" ? "text-red-400" : "text-success";

  return (
    <div
      className={`fixed bottom-7 right-7 z-toast flex items-center gap-3 bg-primeColor text-white px-5 py-3.5 text-sm font-medium font-bodyFont shadow-toast transition-all duration-350 pointer-events-none ${
        visible ? "opacity-100 translate-y-0 animate-toast-in" : "opacity-0 translate-y-5"
      }`}
    >
      <svg className={`w-4 h-4 flex-shrink-0 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  );
}