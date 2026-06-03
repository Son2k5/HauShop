import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessageDto, ChatRoomDto } from "../../@types/chat.type";
import { useAuth } from "../../hooks/useAuth";
import { useChatConnection } from "../../hooks/useChatConnection";
import { chatService } from "../../services/chatService";

export default function AdminChatPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, rooms]
  );

  const refreshRooms = useCallback(async () => {
    const data = await chatService.getRooms();
    setRooms(data);
    setActiveRoomId((current) => current ?? data[0]?.id ?? null);
  }, []);

  const handleMessage = useCallback((message: ChatMessageDto) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message];
    });
    void refreshRooms();
  }, [refreshRooms]);

  const handleRoomUpdated = useCallback(() => {
    void refreshRooms();
  }, [refreshRooms]);

  const { status, joinRoom, leaveRoom, sendMessage, markAsRead } = useChatConnection({
    enabled: Boolean(user),
    onMessage: handleMessage,
    onRoomUpdated: handleRoomUpdated,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await chatService.getRooms();
        if (cancelled) return;
        setRooms(data);
        setActiveRoomId(data[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được danh sách chat.");
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
    if (!activeRoomId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    const loadMessages = async () => {
      try {
        const history = await chatService.getMessages(activeRoomId);
        if (!cancelled) setMessages(history);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được tin nhắn.");
      }
    };

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId || status !== "connected") return;
    void joinRoom(activeRoomId);
    void markAsRead(activeRoomId);
    return () => {
      void leaveRoom(activeRoomId);
    };
  }, [activeRoomId, joinRoom, leaveRoom, markAsRead, status]);

  const canSend = text.trim().length > 0 && status === "connected" && activeRoomId;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeRoomId || !canSend) return;
    const message = text.trim();
    setText("");

    try {
      await sendMessage({ chatRoomId: activeRoomId, message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được tin nhắn.");
      setText(message);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-132px)] overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-[0_20px_54px_rgba(15,23,42,0.08)] lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="border-b border-sky-100 bg-slate-50/70 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-sky-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Hỗ trợ khách hàng</h2>
            <p className="text-xs text-slate-500">{status === "connected" ? "Realtime đang bật" : "Đang kết nối"}</p>
          </div>
          <Icon icon="mdi:headset" width={24} className="text-sky-700" />
        </div>

        <div className="max-h-[calc(100vh-210px)] overflow-y-auto p-3">
          {loading ? (
            <div className="p-4 text-sm text-slate-500">Đang tải...</div>
          ) : rooms.length === 0 ? (
            <div className="p-4 text-sm leading-6 text-slate-500">Chưa có khách hàng nào mở chat support.</div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveRoomId(room.id)}
                className={[
                  "mb-2 grid w-full gap-1 rounded-2xl border px-4 py-3 text-left transition",
                  activeRoomId === room.id
                    ? "border-blue-200 bg-blue-50 text-blue-950"
                    : "border-transparent bg-white text-slate-800 hover:border-sky-100 hover:bg-sky-50",
                ].join(" ")}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{room.customerName}</span>
                  {room.unreadCount > 0 ? (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{room.unreadCount}</span>
                  ) : null}
                </span>
                <span className="truncate text-xs text-slate-500">{room.customerEmail}</span>
                <span className="truncate text-xs text-slate-400">{room.lastMessage?.message ?? "Chưa có tin nhắn"}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="grid min-h-[560px] grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="flex items-center justify-between border-b border-sky-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">{activeRoom?.customerName ?? "Chọn hội thoại"}</h2>
            <p className="truncate text-xs text-slate-500">{activeRoom?.customerEmail ?? "Tin nhan giua admin va user se hien tai day"}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto bg-slate-50/70 p-5">
          {messages.length === 0 ? (
            <div className="m-auto text-center text-sm text-slate-500">
              {activeRoom ? "Chưa có tin nhắn trong hội thoại này." : "Chọn một user để bắt đầu trả lời."}
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
                    {!mine ? <p className="mb-1 text-xs font-semibold text-sky-700">{message.senderName}</p> : null}
                    <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    <p className={["mt-1 text-[11px]", mine ? "text-blue-100" : "text-slate-400"].join(" ")}>
                      {new Date(message.created).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
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
            disabled={!activeRoom}
            maxLength={5000}
            placeholder="Nhập phản hồi..."
            className="min-w-0 flex-1 rounded-2xl border border-sky-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gửi tin nhắn"
          >
            <Icon icon="mdi:send" width={21} />
          </button>
        </form>
      </section>
    </div>
  );
}
