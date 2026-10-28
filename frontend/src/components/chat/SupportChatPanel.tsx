import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessageDto, ChatRoomDto, MessagesReadEventDto } from "../../@types/chat.type";
import { useAuth } from "../../hooks/useAuth";
import { useChatConnection } from "../../hooks/useChatConnection";
import { chatService } from "../../services/chatService";

type Props = {
  onClose: () => void;
  onSwitchToAi?: () => void;
};

const CUSTOMER_QUICK_MESSAGES = [
  "Shop tư vấn giúp mình sản phẩm này với ạ!",
  "Kiểm tra tình trạng đơn hàng giúp mình nhé",
  "Shop còn size M / L không ạ?",
  "Chính sách đổi trả hàng như thế nào ạ?",
];

const QUICK_EMOJIS = ["👋", "😊", "❤️", "👍", "🙏", "🎉", "😍", "🔥", "🛍️", "📦", "✅", "🤝"];

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

function formatDateLabel(isoString: string) {
  const d = new Date(isoString);
  const now = new Date();
  if (isSameDay(isoString, now.toISOString())) return "Hôm nay";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function SupportChatPanel({ onClose, onSwitchToAi }: Props) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleMessage = useCallback((message: ChatMessageDto) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message];
    });
  }, []);

  const handleMessagesRead = useCallback(
    (event: MessagesReadEventDto) => {
      if (event.readerId !== user?.id) {
        const now = new Date().toISOString();
        setMessages((current) =>
          current.map((m) =>
            m.senderId === user?.id && !m.isRead ? { ...m, isRead: true, readAt: now } : m
          )
        );
      }
    },
    [user?.id]
  );

  const { status, joinRoom, leaveRoom, sendMessage, markAsRead } = useChatConnection({
    enabled: Boolean(user),
    onMessage: handleMessage,
    onMessagesRead: handleMessagesRead,
  });

  useEffect(() => {
    let cancelled = false;

    const loadChat = async () => {
      try {
        setLoading(true);
        setError(null);

        const activeRoom = await chatService.startSupportChat("Support chat");
        const history = await chatService.getMessages(activeRoom.id, 100);

        if (cancelled) return;
        setRoom(activeRoom);
        setMessages(history);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không tải được cuộc trò chuyện.");
        }
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
    if (!room || status !== "connected" || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (latest && latest.senderId !== user?.id && !latest.isRead) {
      void markAsRead(room.id);
    }
  }, [markAsRead, messages, room, status, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  const canSend = useMemo(
    () => text.trim().length > 0 && status === "connected" && Boolean(room),
    [room, status, text]
  );

  const sendDirect = async (raw: string) => {
    if (!room || status !== "connected") return;
    const message = raw.trim();
    if (!message) return;

    setError(null);
    try {
      await sendMessage({ chatRoomId: room.id, message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được tin nhắn.");
      setText(message);
    }
  };

  const submitMessage = async () => {
    if (!room || !canSend) return;
    const message = text.trim();
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendDirect(message);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitMessage();
  };

  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].senderId === user?.id) return messages[i].id;
    }
    return null;
  }, [messages, user?.id]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white font-inter antialiased shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header phong cách Zalo / Messenger */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0084ff] to-[#0068ff] px-4 py-3 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white ring-2 ring-white/30">
            <Icon icon="mdi:headset" width={22} />
            <span
              className={[
                "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0068ff]",
                status === "connected" ? "bg-emerald-400" : "bg-amber-300",
              ].join(" ")}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">CSKH HauShop</p>
            <p className="truncate text-[11px] text-blue-100">
              {status === "connected" ? "Đang hoạt động • Phản hồi nhanh" : "Đang kết nối..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onSwitchToAi ? (
            <button
              type="button"
              onClick={onSwitchToAi}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/25"
              title="Chuyển sang chat với AI"
            >
              <Icon icon="mdi:sparkles" width={14} />
              <span>AI</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label="Đóng chat"
          >
            <Icon icon="mdi:close" width={20} />
          </button>
        </div>
      </div>

      {/* Nội dung hội thoại */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#eef0f3] px-3.5 py-4">
        {/* Card giới thiệu đầu khung chat */}
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0084ff] to-[#0068ff] text-white shadow-md">
            <Icon icon="mdi:storefront-outline" width={24} />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-800">Hỗ trợ trực tuyến HauShop</p>
          <p className="text-[11px] text-slate-500">
            Đội ngũ tư vấn viên luôn sẵn sàng giải đáp mọi thắc mắc của bạn.
          </p>
        </div>

        {loading ? (
          <div className="m-auto flex flex-col items-center gap-2 text-xs text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0068ff] border-t-transparent" />
            <span>Đang tải hội thoại...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="my-auto rounded-2xl bg-white/90 p-4 text-center shadow-sm">
            <p className="text-xs font-medium text-slate-700">
              Hãy gửi lời chào hoặc chọn câu hỏi gợi ý bên dưới để bắt đầu trò chuyện!
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((message, index) => {
              const prev = index > 0 ? messages[index - 1] : null;
              const next = index < messages.length - 1 ? messages[index + 1] : null;
              const showDate = !prev || !isSameDay(prev.created, message.created);
              const isFirstInGroup = !prev || !isGroupedWith(prev, message);
              const isLastInGroup = !next || !isGroupedWith(message, next);
              const mine = message.senderId === user?.id;
              const isLastOwn = message.id === lastOwnMessageId;

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
                <div key={message.id}>
                  {showDate ? (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full bg-slate-900/10 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {formatDateLabel(message.created)}
                      </span>
                    </div>
                  ) : null}

                  <div
                    className={[
                      "flex items-end gap-2",
                      mine ? "justify-end" : "justify-start",
                      isFirstInGroup ? "mt-2.5" : "mt-0.5",
                    ].join(" ")}
                  >
                    {!mine ? (
                      <div className="w-7 shrink-0">
                        {isLastInGroup ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0084ff] to-[#0068ff] text-white shadow-sm">
                            <Icon icon="mdi:headset" width={15} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div
                      className={[
                        "flex max-w-[78%] flex-col",
                        mine ? "items-end" : "items-start",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "px-3.5 py-2 text-[13.5px] leading-[1.45] shadow-sm",
                          bubbleRadius,
                          mine
                            ? "bg-gradient-to-br from-[#0084ff] to-[#0068ff] text-white"
                            : "bg-white text-slate-900 ring-1 ring-slate-200/70",
                        ].join(" ")}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.message}</p>
                        {isLastInGroup ? (
                          <p
                            className={[
                              "mt-1 text-[10px]",
                              mine ? "text-right text-blue-100" : "text-slate-400",
                            ].join(" ")}
                          >
                            {new Date(message.created).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        ) : null}
                      </div>

                      {mine && isLastOwn ? (
                        <span className="mt-0.5 pr-1 text-[10px] text-slate-500">
                          {message.isRead ? "Đã xem" : "Đã gửi"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error ? (
        <div className="border-t border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {/* Gợi ý câu hỏi nhanh */}
      <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2">
        {CUSTOMER_QUICK_MESSAGES.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setText(suggestion);
              textareaRef.current?.focus();
            }}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-[#0068ff]/40 hover:bg-[#e7f3ff] hover:text-[#0068ff]"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Bảng chọn Emoji nhanh */}
      {showEmojis ? (
        <div className="grid grid-cols-6 gap-1 border-t border-slate-100 bg-slate-50 px-3 py-2">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setText((prev) => `${prev}${emoji}`);
                setShowEmojis(false);
                textareaRef.current?.focus();
              }}
              className="flex h-8 items-center justify-center rounded-lg text-base transition hover:bg-white hover:shadow-sm"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      {/* Thanh nhập tin nhắn */}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-1.5 border-t border-slate-100 bg-white p-2.5"
      >
        <button
          type="button"
          onClick={() => setShowEmojis((prev) => !prev)}
          className={[
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
            showEmojis
              ? "bg-[#e7f3ff] text-[#0068ff]"
              : "text-slate-500 hover:bg-slate-100 hover:text-[#0068ff]",
          ].join(" ")}
          aria-label="Chọn biểu tượng cảm xúc"
        >
          <Icon icon="mdi:emoticon-happy-outline" width={20} />
        </button>

        <div className="flex min-h-[38px] flex-1 items-center rounded-2xl bg-[#f0f2f5] px-3.5 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0068ff]/25">
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
            placeholder="Nhập tin nhắn..."
            className="max-h-24 w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        {text.trim().length > 0 ? (
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0068ff] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gửi tin nhắn"
          >
            <Icon icon="mdi:send" width={18} />
          </button>
        ) : (
          <button
            type="button"
            disabled={status !== "connected"}
            onClick={() => void sendDirect("👍")}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition hover:bg-slate-100 disabled:opacity-40"
            aria-label="Gửi thích"
            title="Gửi nhanh 👍"
          >
            👍
          </button>
        )}
      </form>
    </div>
  );
}
