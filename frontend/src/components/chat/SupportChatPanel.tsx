import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessageDto, ChatRoomDto } from "../../@types/chat.type";
import { useAuth } from "../../hooks/useAuth";
import { useChatConnection } from "../../hooks/useChatConnection";
import { chatService } from "../../services/chatService";

type Props = {
  onClose: () => void;
};

function SendIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
        d="m4 12 16-8-4 16-4-6-8-2Zm8 2 8-10"
      />
    </svg>
  );
}

export default function SupportChatPanel({ onClose }: Props) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleMessage = useCallback((message: ChatMessageDto) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message];
    });
  }, []);

  const { status, joinRoom, leaveRoom, sendMessage, markAsRead } = useChatConnection({
    enabled: Boolean(user),
    onMessage: handleMessage,
  });

  useEffect(() => {
    let cancelled = false;

    const loadChat = async () => {
      try {
        setLoading(true);
        setError(null);

        const activeRoom = await chatService.startSupportChat("Support chat");
        const history = await chatService.getMessages(activeRoom.id);

        if (cancelled) return;
        setRoom(activeRoom);
        setMessages(history);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không tải được chat.");
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  const canSend = useMemo(
    () => text.trim().length > 0 && status === "connected" && Boolean(room),
    [room, status, text]
  );

  const submitMessage = async () => {
    if (!room || !canSend) return;

    const message = text.trim();
    setText("");
    setError(null);

    try {
      await sendMessage({ chatRoomId: room.id, message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được tin nhắn.");
      setText(message);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitMessage();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-red-100 bg-white shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-4 text-white">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Nhân viên HauShop</p>
          <p className="text-xs text-white/80">
            {status === "connected" ? "Chat realtime với bộ phận hỗ trợ" : "Đang kết nối..."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white"
          aria-label="Đóng chat"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-4">
        {loading ? (
          <div className="m-auto text-sm text-slate-500">Đang tải hội thoại...</div>
        ) : messages.length === 0 ? (
          <div className="m-auto max-w-xs text-center text-sm leading-6 text-slate-500">
            Hãy gửi câu hỏi đầu tiên, nhân viên HauShop sẽ nhận tin nhắn realtime.
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === user?.id;

            return (
              <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={[
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                    mine
                      ? "rounded-br-md bg-slate-900 text-white"
                      : "rounded-bl-md border border-slate-100 bg-white text-slate-800",
                  ].join(" ")}
                >
                  <p className="whitespace-pre-wrap break-words">{message.message}</p>
                  <p className={["mt-1 text-[10px]", mine ? "text-slate-300" : "text-slate-400"].join(" ")}>
                    {new Date(message.created).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error ? <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-slate-100 bg-white p-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submitMessage();
            }
          }}
          rows={1}
          maxLength={5000}
          placeholder="Nhập tin nhắn cho nhân viên..."
          className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Gửi tin nhắn"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
