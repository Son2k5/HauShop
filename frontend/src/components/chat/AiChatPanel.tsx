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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="m4 12 16-8-4 16-4-6-8-2Zm8 2 8-10" />
    </svg>
  );
}

export default function AiChatPanel({ onClose }: Props) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
        const history = await chatService.getMessages(activeRoom.id);

        if (cancelled) return;
        setRoom(activeRoom);
        setMessages(history);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Khong tai duoc AI chat.");
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
    setError(null);
    setIsSending(true);

    try {
      await sendAiMessage({ chatRoomId: room.id, message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Khong gui duoc tin nhan cho AI.");
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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-red-100 bg-white shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between bg-gradient-to-r from-red-500 to-rose-500 px-4 py-4 text-white">
        <div className="min-w-0">
          <p className="text-sm font-semibold">HauShop AI</p>
          <p className="text-xs text-white/80">
            {status === "connected" ? "Tu van san pham, don hang va chinh sach" : "Dang ket noi..."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white"
          aria-label="Dong AI chat"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-4">
        {loading ? (
          <div className="m-auto text-sm text-slate-500">Dang tai AI chat...</div>
        ) : messages.length === 0 ? (
          <div className="m-auto max-w-xs text-center text-sm leading-6 text-slate-500">
            Hoi AI ve san pham, gia, mau, size, don hang, chinh sach, combo hoac doi tra.
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
                      ? "rounded-br-md bg-red-500 text-white"
                      : "rounded-bl-md border border-slate-100 bg-white text-slate-800",
                  ].join(" ")}
                >
                  <p className="whitespace-pre-wrap break-words">{message.message}</p>
                  <p className={["mt-1 text-[10px]", mine ? "text-red-100" : "text-slate-400"].join(" ")}>
                    {new Date(message.created).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-sm">
              AI dang phan tich va tim du lieu...
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {error ? <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="border-t border-slate-100 bg-white px-3 pt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 text-xs">
          {[
            "Tu van ao khoac duoi 500k",
            "Loc mau den size L",
            "Kiem tra don hang cua toi",
            "Chinh sach doi tra",
            "Goi y combo",
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setText(suggestion)}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 bg-white p-3 pt-1">
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
          placeholder="Hoi AI HauShop..."
          className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Gui tin nhan cho AI"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
