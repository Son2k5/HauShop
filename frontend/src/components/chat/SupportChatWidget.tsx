import { lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../lib/routes";

const AiChatPanel = lazy(() => import("./AiChatPanel"));
const SupportChatPanel = lazy(() => import("./SupportChatPanel"));

type ActivePanel = "ai" | "support" | null;
type SupportChatWidgetProps = {
  initialPanel?: Exclude<ActivePanel, null>;
};

function CloseIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function AiIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v3m0 12v3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12M3 12h3m12 0h3M5.64 18.36l2.12-2.12m8.48-8.48 2.12-2.12M12 8.5A3.5 3.5 0 1 1 12 15.5 3.5 3.5 0 0 1 12 8.5Z" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8 10h8M8 14h5m8-2a9 9 0 1 1-4.2-7.62L21 4l-1.38 4.2A8.96 8.96 0 0 1 21 12Z"
      />
    </svg>
  );
}

function ChatPanelSkeleton({ tone }: { tone: "ai" | "support" }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
      <div className={["h-16 animate-pulse", tone === "ai" ? "bg-red-500" : "bg-slate-900"].join(" ")} />
      <div className="flex-1 space-y-3 p-4">
        <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-gray-100" />
        <div className="ml-auto h-12 w-2/3 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

function SignInPrompt({ activePanel, onClose }: { activePanel: Exclude<ActivePanel, null>; onClose: () => void }) {
  const navigate = useNavigate();
  const isAi = activePanel === "ai";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
      <div className={["flex items-center justify-between px-4 py-4 text-white", isAi ? "bg-red-500" : "bg-slate-900"].join(" ")}>
        <div>
          <p className="text-sm font-semibold">{isAi ? "HauShop AI" : "Nhan vien HauShop"}</p>
          <p className="text-xs text-white/80">{isAi ? "Tư vấn sản phẩm và đơn hàng" : "Chat realtime với nhân viên"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white"
          aria-label="Dong chat"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className={["mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full", isAi ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-900"].join(" ")}>
          {isAi ? <AiIcon /> : <SupportIcon />}
        </div>
        <h2 className="text-lg font-semibold text-gray-950">
          {isAi ? "Đăng nhập để chat với HauShop AI" : "Đăng nhập để chat với nhân viên"}
        </h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
          {isAi
            ? "Bạn cần đăng nhập để AI ghi nhớ lịch sử chat và kiểm tra đơn hàng."
            : "Bạn cần đăng nhập để bắt đầu hội thoại realtime với bộ phận hỗ trợ."}
        </p>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate(ROUTES.SIGN_IN);
          }}
          className={["mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition", isAi ? "bg-red-500 hover:bg-red-600" : "bg-slate-900 hover:bg-slate-700"].join(" ")}
        >
          Dang nhap
        </button>
      </div>
    </div>
  );
}

function FloatingButton({
  active,
  label,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  tone: "ai" | "support";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "ml-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_14px_34px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 sm:h-16 sm:w-16",
        tone === "ai" ? "bg-red-500 hover:bg-red-600 focus:ring-red-200" : "bg-slate-900 hover:bg-slate-700 focus:ring-slate-200",
      ].join(" ")}
      aria-label={label}
    >
      {active ? <CloseIcon /> : children}
    </button>
  );
}

export default function SupportChatWidget({ initialPanel }: SupportChatWidgetProps) {
  const { isAuthenticated } = useAuth();
  const [activePanel, setActivePanel] = useState<ActivePanel>(initialPanel ?? null);

  useEffect(() => {
    if (initialPanel) {
      setActivePanel(initialPanel);
    }
  }, [initialPanel]);

  const closePanel = () => setActivePanel(null);

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      {activePanel ? (
        <div
          className={[
            "mb-4 w-[calc(100vw-2rem)] max-w-[390px]",
            "h-[460px] max-h-[calc(100vh-9rem)]",
          ].join(" ")}
        >
          {isAuthenticated ? (
            <Suspense fallback={<ChatPanelSkeleton tone={activePanel} />}>
              {activePanel === "ai" ? <AiChatPanel onClose={closePanel} /> : <SupportChatPanel onClose={closePanel} />}
            </Suspense>
          ) : (
            <SignInPrompt activePanel={activePanel} onClose={closePanel} />
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <FloatingButton
          active={activePanel === "ai"}
          label={activePanel === "ai" ? "Đóng AI chat" : "Mở AI chat"}
          tone="ai"
          onClick={() => setActivePanel((current) => (current === "ai" ? null : "ai"))}
        >
          <AiIcon />
        </FloatingButton>

        <FloatingButton
          active={activePanel === "support"}
          label={activePanel === "support" ? "Đóng chat nhân viên" : "Mở chat nhân viên"}
          tone="support"
          onClick={() => setActivePanel((current) => (current === "support" ? null : "support"))}
        >
          <SupportIcon />
        </FloatingButton>
      </div>
    </div>
  );
}
