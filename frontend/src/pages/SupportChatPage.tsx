import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessageDto, ChatRoomDto } from "../@types/chat.type";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { useAuth } from "../hooks/useAuth";
import { useChatConnection } from "../hooks/useChatConnection";
import { chatService } from "../services/chatService";

function SupportChatContent() {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: ChatMessageDto) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message];
    });
  }, []);

  const { status, joinRoom, sendMessage, markAsRead } = useChatConnection({
    enabled: Boolean(user),
    onMessage: handleMessage,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const activeRoom = await chatService.startSupportChat("Support chat");
        const history = await chatService.getMessages(activeRoom.id);
        if (cancelled) return;
        setRoom(activeRoom);
        setMessages(history);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Khong tai duoc chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!room || status !== "connected") return;
    void joinRoom(room.id);
    void markAsRead(room.id);
  }, [joinRoom, markAsRead, room, status]);

  const canSend = useMemo(() => text.trim().length > 0 && status === "connected" && room, [room, status, text]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!room || !canSend) return;

    const message = text.trim();
    setText("");
    try {
      await sendMessage({ chatRoomId: room.id, message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Khong gui duoc tin nhan.");
      setText(message);
    }
  };

  return (
    <section className="bg-[#f8fbff] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[70vh] max-w-5xl overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-[0_24px_70px_rgba(14,165,233,0.12)]">
        <div className="flex items-center justify-between border-b border-sky-100 px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Ho tro truc tuyen</h1>
            <p className="text-sm text-slate-500">{status === "connected" ? "Dang ket noi voi admin" : "Dang ket noi..."}</p>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-700">
            <Icon icon="mdi:chat-processing-outline" width={24} />
          </span>
        </div>

        <div className="flex min-h-[420px] flex-col gap-3 overflow-y-auto bg-slate-50/70 p-5">
          {loading ? (
            <div className="m-auto text-sm text-slate-500">Dang tai hoi thoai...</div>
          ) : messages.length === 0 ? (
            <div className="m-auto max-w-sm text-center text-sm leading-6 text-slate-500">
              Hay gui cau hoi dau tien, admin se nhan tin nhan realtime.
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.senderId === user?.id;
              return (
                <div key={message.id} className={["flex", mine ? "justify-end" : "justify-start"].join(" ")}>
                  <div
                    className={[
                      "max-w-[76%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                      mine ? "bg-blue-600 text-white" : "border border-sky-100 bg-white text-slate-800",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    <p className={["mt-1 text-[11px]", mine ? "text-blue-100" : "text-slate-400"].join(" ")}>
                      {new Date(message.created).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error ? <div className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">{error}</div> : null}

        <form onSubmit={onSubmit} className="flex gap-3 border-t border-sky-100 p-4">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={5000}
            placeholder="Nhap tin nhan..."
            className="min-w-0 flex-1 rounded-2xl border border-sky-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gui tin nhan"
          >
            <Icon icon="mdi:send" width={21} />
          </button>
        </form>
      </div>
    </section>
  );
}

export default function SupportChatPage() {
  return (
    <ProtectedRoute>
      <SupportChatContent />
    </ProtectedRoute>
  );
}
