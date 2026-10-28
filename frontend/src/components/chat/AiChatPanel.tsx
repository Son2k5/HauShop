import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessageDto, ChatRoomDto } from "../../@types/chat.type";
import { useAuth } from "../../hooks/useAuth";
import { useChatConnection } from "../../hooks/useChatConnection";
import { chatService } from "../../services/chatService";

type Props = {
  onClose: () => void;
  onSwitchToSupport?: () => void;
};

const AI_SUGGESTIONS = [
  "Tư vấn áo khoác dưới 500k",
  "Lọc màu đen size L",
  "Kiểm tra đơn hàng của tôi",
  "Chính sách đổi trả",
  "Gợi ý phối đồ combo",
];

function isSameDay(a: string, b: string) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isGroupedWith(a: ChatMessageDto, b: ChatMessageDto) {
  if (a.senderId !== b.senderId) return false;
  if (!isSameDay(a.created, b.created)) return false;
  return Math.abs(new Date(b.created).getTime() - new Date(a.created).getTime()) <= 5 * 60 * 1000;
}

export default function AiChatPanel({ onClose, onSwitchToSupport }: Props) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleMessage = useCallback((message: ChatMessageDto) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message];
    });
  }, []);

  const { status, joinRoom, leaveRoom, sendAiMessage, markAsRead } = useChatConnection({
    enabled: Boolean(user),
    onMessage: handleMessage,
  });

  useEffect(() => {
    let cancelled = false;

    const loadChat = async () => {
      try {
        setLoading(true);
        setError(null);

        const activeRoom = await chatService.startAiChat();
        const history = await chatService.getMessages(activeRoom.id, 100);

        if (cancelled) return;
        setRoom(activeRoom);
        setMessages(history);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được AI chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadChat();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!room || status !== "connected") return;

    void joinRoom(room.id);
    void markAsRead(room.id);

    return () => {
      void leaveRoom(room.id);
    };
  }, [joinRoom, leaveRoom, markAsRead, room, status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading, isSending]);

  const canSend = useMemo(
    () => text.trim().length > 0 && status === "connected" && Boolean(room) && !isSending,
    [isSending, room, status, text]
  );

  const submitMessage = async () => {
    if (!room || !canSend) return;

    const message = text.trim();
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setError(null);
    setIsSending(true);

    try {
      await sendAiMessage({ chatRoomId: room.id, message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được tin nhắn cho AI.");
      setText(message);
    } finally {
      setIsSending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitMessage();
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white font-inter antialiased shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header phong cách Messenger AI */}
      <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-3 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white ring-2 ring-white/30">
            <Icon icon="mdi:robot-happy-outline" width={22} />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-indigo-600 bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">Trợ lý AI HauShop</p>
            <p className="truncate text-[11px] text-indigo-100">
              {status === "connected" ? "Tư vấn sản phẩm & tra cứu 24/7" : "Đang kết nối..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onSwitchToSupport ? (
            <button
              type="button"
              onClick={onSwitchToSupport}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/25"
              title="Chuyển sang chat với nhân viên"
            >
              <Icon icon="mdi:headset" width={14} />
              <span>Nhân viên</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label="Đóng AI chat"
          >
            <Icon icon="mdi:close" width={20} />
          </button>
        </div>
      </div>

      {/* Nội dung hội thoại */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#eef0f3] px-3.5 py-4">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md">
            <Icon icon="mdi:sparkles" width={24} />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-800">HauShop AI Assistant</p>
          <p className="text-[11px] text-slate-500">
            Hỗ trợ tìm sản phẩm, lọc màu/size, kiểm tra đơn hàng & chính sách.
          </p>
        </div>

        {loading ? (
          <div className="m-auto flex flex-col items-center gap-2 text-xs text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Đang khởi tạo trợ lý AI...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="my-auto rounded-2xl bg-white/90 p-4 text-center shadow-sm">
            <p className="text-xs font-medium text-slate-700">
              Chọn một gợi ý bên dưới hoặc nhập câu hỏi bất kỳ để AI tư vấn ngay cho bạn!
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((message, index) => {
              const prev = index > 0 ? messages[index - 1] : null;
              const next = index < messages.length - 1 ? messages[index + 1] : null;
              const isFirstInGroup = !prev || !isGroupedWith(prev, message);
              const isLastInGroup = !next || !isGroupedWith(message, next);
              const mine = message.senderId === user?.id;

              const bubbleRadius = mine
                ? [
                    "rounded-[18px]",
                    !isFirstInGroup ? "rounded-tr-[5px]" : "",
                    !isLastInGroup ? "rounded-br-[5px]" : "rounded-br-[4px]",
                  ].join(" ")
                : [
                    "rounded-[18px]",
                    !isFirstInGroup ? "rounded-tl-[5px]" : "",
                    !isLastInGroup ? "rounded-bl-[5px]" : "rounded-bl-[4px]",
                  ].join(" ");

              return (
                <div
                  key={message.id}
                  className={[
                    "flex items-end gap-2",
                    mine ? "justify-end" : "justify-start",
                    isFirstInGroup ? "mt-2.5" : "mt-0.5",
                  ].join(" ")}
                >
                  {!mine ? (
                    <div className="w-7 shrink-0">
                      {isLastInGroup ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm">
                          <Icon icon="mdi:robot-happy-outline" width={15} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div
                    className={[
                      "max-w-[80%] px-3.5 py-2 text-[13.5px] leading-[1.45] shadow-sm",
                      bubbleRadius,
                      mine
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                        : "bg-white text-slate-900 ring-1 ring-slate-200/70",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    {isLastInGroup ? (
                      <p
                        className={[
                          "mt-1 text-[10px]",
                          mine ? "text-right text-indigo-100" : "text-slate-400",
                        ].join(" ")}
                      >
                        {new Date(message.created).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isSending ? (
          <div className="mt-2.5 flex items-end gap-2 justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm">
              <Icon icon="mdi:robot-happy-outline" width={15} />
            </div>
            <div className="flex items-center gap-1.5 rounded-[18px] rounded-bl-[4px] bg-white px-4 py-3 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200/70">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" />
              <span className="ml-1 text-[11px] text-slate-400">AI đang phản hồi...</span>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {error ? (
        <div className="border-t border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {/* Thanh gợi ý nhanh */}
      <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2">
        {AI_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setText(suggestion);
              textareaRef.current?.focus();
            }}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Thanh nhập tin nhắn */}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-slate-100 bg-white p-2.5"
      >
        <div className="flex min-h-[38px] flex-1 items-center rounded-2xl bg-[#f0f2f5] px-3.5 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/25">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 96)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitMessage();
              }
            }}
            rows={1}
            maxLength={5000}
            placeholder="Hỏi trợ lý AI HauShop..."
            className="max-h-24 w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Gửi tin nhắn cho AI"
        >
          <Icon icon="mdi:send" width={18} />
        </button>
      </form>
    </div>
  );
}
