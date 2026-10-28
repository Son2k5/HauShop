import { Icon } from "@iconify/react";
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

function ChatPanelSkeleton({ tone }: { tone: "ai" | "support" }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
      <div
        className={[
          "h-16 animate-pulse",
          tone === "ai"
            ? "bg-gradient-to-r from-violet-600 to-blue-600"
            : "bg-gradient-to-r from-[#0084ff] to-[#0068ff]",
        ].join(" ")}
      />
      <div className="flex-1 space-y-3 bg-[#eef0f3] p-4">
        <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-white" />
        <div className="ml-auto h-12 w-2/3 animate-pulse rounded-2xl bg-blue-200/70" />
        <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

function SignInPrompt({
  activePanel,
  onClose,
}: {
  activePanel: Exclude<ActivePanel, null>;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const isAi = activePanel === "ai";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
      <div
        className={[
          "flex items-center justify-between px-4 py-3.5 text-white",
          isAi
            ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600"
            : "bg-gradient-to-r from-[#0084ff] to-[#0068ff]",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Icon icon={isAi ? "mdi:robot-happy-outline" : "mdi:headset"} width={20} />
          </div>
          <div>
            <p className="text-sm font-bold">{isAi ? "Trợ lý AI HauShop" : "CSKH HauShop"}</p>
            <p className="text-[11px] text-white/85">
              {isAi ? "Tư vấn sản phẩm và đơn hàng" : "Chat trực tuyến với nhân viên"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white"
          aria-label="Đóng chat"
        >
          <Icon icon="mdi:close" width={20} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-[#eef0f3] px-6 text-center">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div
            className={[
              "mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md",
              isAi
                ? "bg-gradient-to-br from-violet-600 to-indigo-600"
                : "bg-gradient-to-br from-[#0084ff] to-[#0068ff]",
            ].join(" ")}
          >
            <Icon icon={isAi ? "mdi:robot-happy-outline" : "mdi:facebook-messenger"} width={32} />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {isAi ? "Đăng nhập để chat với AI" : "Đăng nhập để chat hỗ trợ"}
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            {isAi
              ? "Đăng nhập tài khoản để trợ lý AI ghi nhớ lịch sử trò chuyện và tra cứu đơn hàng của bạn."
              : "Đăng nhập tài khoản để kết nối trực tiếp với nhân viên tư vấn HauShop giống Zalo / Messenger."}
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(ROUTES.SIGN_IN);
            }}
            className={[
              "mt-5 inline-flex h-10 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-sm transition",
              isAi
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-105"
                : "bg-gradient-to-r from-[#0084ff] to-[#0068ff] hover:brightness-105",
            ].join(" ")}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  );
}

function FloatingButton({
  active,
  label,
  badge,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  badge: string;
  tone: "ai" | "support";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative ml-auto flex h-13 w-13 items-center justify-center rounded-full text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 sm:h-14 sm:w-14",
        tone === "ai"
          ? "bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 focus:ring-indigo-200"
          : "bg-gradient-to-br from-[#0084ff] to-[#0068ff] focus:ring-blue-200",
      ].join(" ")}
      aria-label={label}
      title={label}
    >
      {active ? <Icon icon="mdi:close" width={24} /> : children}
      {!active ? (
        <span className="pointer-events-none absolute right-full mr-2.5 hidden whitespace-nowrap rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-md transition group-hover:opacity-100 sm:block">
          {badge}
        </span>
      ) : null}
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
    <div
      className="fixed bottom-4 right-4 z-[80] font-inter antialiased sm:bottom-6 sm:right-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {activePanel ? (
        <div
          className={[
            "mb-3.5 w-[calc(100vw-1.5rem)] max-w-[395px]",
            "h-[540px] max-h-[calc(100vh-8.5rem)]",
          ].join(" ")}
        >
          {isAuthenticated ? (
            <Suspense fallback={<ChatPanelSkeleton tone={activePanel} />}>
              {activePanel === "ai" ? (
                <AiChatPanel
                  onClose={closePanel}
                  onSwitchToSupport={() => setActivePanel("support")}
                />
              ) : (
                <SupportChatPanel
                  onClose={closePanel}
                  onSwitchToAi={() => setActivePanel("ai")}
                />
              )}
            </Suspense>
          ) : (
            <SignInPrompt activePanel={activePanel} onClose={closePanel} />
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <FloatingButton
          active={activePanel === "ai"}
          label={activePanel === "ai" ? "Đóng AI chat" : "Mở Trợ lý AI"}
          badge="Trợ lý AI 24/7"
          tone="ai"
          onClick={() => setActivePanel((current) => (current === "ai" ? null : "ai"))}
        >
          <Icon icon="mdi:robot-happy-outline" width={25} />
        </FloatingButton>

        <FloatingButton
          active={activePanel === "support"}
          label={activePanel === "support" ? "Đóng chat nhân viên" : "Mở chat CSKH"}
          badge="Chat với CSKH"
          tone="support"
          onClick={() => setActivePanel((current) => (current === "support" ? null : "support"))}
        >
          <Icon icon="mdi:facebook-messenger" width={26} />
        </FloatingButton>
      </div>
    </div>
  );
}
