import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { ChatMessageDto, ChatRoomDto, MessagesReadEventDto } from "../../@types/chat.type";
import { useAuth } from "../../hooks/useAuth";
import { useChatConnection } from "../../hooks/useChatConnection";
import { chatService } from "../../services/chatService";
import { getInitials } from "./adminShared";

type RoomFilter = "all" | "unread" | "priority";

const AVATAR_GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-fuchsia-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-orange-500",
  "from-indigo-500 to-blue-600",
  "from-amber-500 to-orange-600",
];

const QUICK_REPLIES = [
  "Xin chào! HauShop có thể hỗ trợ gì cho bạn hôm nay ạ? 👋",
  "Dạ bạn vui lòng cho shop xin Mã đơn hàng hoặc Số điện thoại đặt hàng để kiểm tra nhé ạ.",
  "Dạ sản phẩm này hiện bên mình vẫn còn đủ màu và size, bạn đặt hàng ngay trên web được nhé!",
  "Shop đã tiếp nhận thông tin và đang kiểm tra bộ phận kho/vận chuyển cho mình rồi ạ.",
  "Chính sách đổi trả của HauShop hỗ trợ trong vòng 7 ngày kể từ khi nhận hàng ạ.",
  "Cảm ơn bạn đã tin tưởng và mua sắm tại HauShop ❤️ Chúc bạn một ngày tốt lành!",
];

const COMMON_EMOJIS = [
  "👋", "😊", "❤️", "👍", "🙏", "🎉",
  "🔥", "😍", "🤝", "✅", "📦", "🚚",
  "💯", "🌟", "✨", "😄", "🥰", "👕",
  "👖", "🛍️", "💬", "⚡", "🎁", "🌹",
];

function getAvatarGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function formatRelativeTime(isoString?: string | null) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Hôm qua";

  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatDateDivider(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return "Hôm nay";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Hôm qua";

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatLastSeen(lastSeen?: string | null, isOnline?: boolean) {
  if (isOnline) return "Đang hoạt động";
  if (!lastSeen) return "Ngoại tuyến";
  const rel = formatRelativeTime(lastSeen);
  return rel ? `Hoạt động ${rel === "Vừa xong" ? "vừa xong" : `${rel} trước`}` : "Ngoại tuyến";
}

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
  const diff = Math.abs(new Date(b.created).getTime() - new Date(a.created).getTime());
  return diff <= 5 * 60 * 1000;
}

function ChatAvatar({
  name,
  avatar,
  isOnline,
  size = "md",
}: {
  name: string;
  avatar?: string | null;
  isOnline?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass = {
    xs: "h-4 w-4 text-[8px]",
    sm: "h-7 w-7 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-20 w-20 text-xl",
  }[size];

  const dotClass = {
    xs: "hidden",
    sm: "h-2 w-2 border",
    md: "h-2.5 w-2.5 border-2",
    lg: "h-3 w-3 border-2",
    xl: "h-4 w-4 border-2 right-1 bottom-1",
  }[size];

  return (
    <div className="relative inline-flex shrink-0 select-none">
      <div
        className={[
          "flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white shadow-sm",
          getAvatarGradient(name || "U"),
          sizeClass,
        ].join(" ")}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {typeof isOnline === "boolean" && size !== "xs" ? (
        <span
          className={[
            "absolute bottom-0 right-0 rounded-full border-white",
            isOnline ? "bg-emerald-500" : "bg-slate-300",
            dotClass,
          ].join(" ")}
          title={isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
        />
      ) : null}
    </div>
  );
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zalo / Messenger UI states
  const [roomSearch, setRoomSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState<RoomFilter>("all");
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [roomNotes, setRoomNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("haushop_admin_chat_notes");
      return saved ? (JSON.parse(saved) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeRoomIdRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, rooms]
  );

  const totalUnread = useMemo(
    () => rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0),
    [rooms]
  );

  const unreadRoomsCount = useMemo(
    () => rooms.filter((r) => r.unreadCount > 0).length,
    [rooms]
  );

  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    return rooms.filter((room) => {
      if (roomFilter === "unread" && room.unreadCount <= 0) return false;
      if (roomFilter === "priority" && room.priority !== "High" && room.status !== "Waiting") {
        return false;
      }
      if (!q) return true;
      return (
        room.customerName.toLowerCase().includes(q) ||
        room.customerEmail.toLowerCase().includes(q) ||
        (room.customerPhone ?? "").toLowerCase().includes(q) ||
        (room.lastMessage?.message ?? "").toLowerCase().includes(q)
      );
    });
  }, [roomFilter, roomSearch, rooms]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const refreshRooms = useCallback(async () => {
    try {
      const data = await chatService.getRooms();
      setRooms(data);
      setActiveRoomId((current) => current ?? data[0]?.id ?? null);
    } catch {
      // ignore background refresh error
    }
  }, []);

  const handleMessage = useCallback(
    (message: ChatMessageDto) => {
      if (message.chatRoomId === activeRoomIdRef.current) {
        setMessages((current) => {
          if (current.some((item) => item.id === message.id)) return current;
          return [...current, message];
        });
      }
      void refreshRooms();
    },
    [refreshRooms]
  );

  const handleRoomUpdated = useCallback(() => {
    void refreshRooms();
  }, [refreshRooms]);

  const handleMessagesRead = useCallback(
    (event: MessagesReadEventDto) => {
      if (event.chatRoomId === activeRoomIdRef.current && event.readerId !== user?.id) {
        const readTime = new Date().toISOString();
        setMessages((current) =>
          current.map((msg) =>
            msg.senderId === user?.id && !msg.isRead
              ? { ...msg, isRead: true, readAt: readTime }
              : msg
          )
        );
      }
      void refreshRooms();
    },
    [refreshRooms, user?.id]
  );

  const { status, joinRoom, leaveRoom, sendMessage, markAsRead } = useChatConnection({
    enabled: Boolean(user),
    onMessage: handleMessage,
    onRoomUpdated: handleRoomUpdated,
    onMessagesRead: handleMessagesRead,
  });

  // Mark incoming messages as read if we are actively viewing that room
  useEffect(() => {
    if (!activeRoomId || status !== "connected" || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.senderId !== user?.id && !lastMessage.isRead) {
      void markAsRead(activeRoomId);
      setRooms((current) =>
        current.map((r) => (r.id === activeRoomId ? { ...r, unreadCount: 0 } : r))
      );
    }
  }, [activeRoomId, markAsRead, messages, status, user?.id]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await chatService.getRooms();
        if (cancelled) return;
        setRooms(data);
        setActiveRoomId((current) => current ?? data[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không tải được danh sách hội thoại.");
        }
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
        setMessagesLoading(true);
        setError(null);
        const history = await chatService.getMessages(activeRoomId, 100);
        if (!cancelled) {
          setMessages(history);
          setRooms((current) =>
            current.map((r) => (r.id === activeRoomId ? { ...r, unreadCount: 0 } : r))
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không tải được tin nhắn.");
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
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

  useEffect(() => {
    if (!messagesLoading) {
      scrollToBottom("smooth");
    }
  }, [messages.length, messagesLoading, scrollToBottom]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScrollMessages = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceFromBottom > 180);
  };

  const canSend = Boolean(text.trim().length > 0 && status === "connected" && activeRoomId);

  const sendDirectMessage = async (rawMessage: string) => {
    if (!activeRoomId || status !== "connected") return;
    const trimmed = rawMessage.trim();
    if (!trimmed) return;

    setError(null);
    try {
      await sendMessage({ chatRoomId: activeRoomId, message: trimmed });
      setTimeout(() => scrollToBottom("smooth"), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được tin nhắn.");
      setText(trimmed);
    }
  };

  const submitMessage = async () => {
    if (!activeRoomId || !canSend) return;
    const message = text.trim();
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendDirectMessage(message);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitMessage();
  };

  const handleNoteChange = (roomId: string, value: string) => {
    setRoomNotes((current) => {
      const next = { ...current, [roomId]: value };
      try {
        localStorage.setItem("haushop_admin_chat_notes", JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  };

  const handleCopy = async (label: string, value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard error
    }
  };

  const displayedMessages = useMemo(() => {
    const q = messageSearchQuery.trim().toLowerCase();
    if (!messageSearchOpen || !q) return messages;
    return messages.filter((m) => m.message.toLowerCase().includes(q));
  }, [messageSearchOpen, messageSearchQuery, messages]);

  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].senderId === user?.id) return messages[i].id;
    }
    return null;
  }, [messages, user?.id]);

  return (
    <div
      className="flex h-[calc(100vh-3rem)] w-full max-w-none flex-1 overflow-hidden bg-white font-inter text-slate-900 antialiased sm:h-[calc(100vh-3.5rem)]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* CỘT TRÁI: DANH SÁCH HỘI THOẠI (ZALO / MESSENGER STYLE) */}
      <aside
        className={[
          "flex w-full shrink-0 flex-col border-r border-slate-200/80 bg-white lg:w-[320px] xl:w-[340px]",
          mobileShowChat ? "hidden lg:flex" : "flex",
        ].join(" ")}
      >
        {/* Header cột trái */}
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Chat hỗ trợ</h1>
              {totalUnread > 0 ? (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0068ff] px-1.5 text-[11px] font-bold text-white shadow-sm">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                  status === "connected"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80"
                    : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    status === "connected" ? "animate-pulse bg-emerald-500" : "bg-amber-500",
                  ].join(" ")}
                />
                {status === "connected" ? "Trực tuyến" : "Đang kết nối"}
              </span>

              <button
                type="button"
                onClick={() => void refreshRooms()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200/80 hover:text-slate-900"
                title="Làm mới danh sách"
                aria-label="Làm mới danh sách"
              >
                <Icon icon="mdi:refresh" width={17} />
              </button>
            </div>
          </div>

          {/* Ô tìm kiếm phong cách Messenger / Zalo */}
          <div className="relative mt-3">
            <Icon
              icon="mdi:magnify"
              width={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              placeholder="Tìm tên khách hàng, email, tin nhắn..."
              className="h-9 w-full rounded-full border border-transparent bg-[#f0f2f5] pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-400 transition focus:border-[#0068ff]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0068ff]/15"
            />
            {roomSearch ? (
              <button
                type="button"
                onClick={() => setRoomSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <Icon icon="mdi:close" width={13} />
              </button>
            ) : null}
          </div>

          {/* Bộ lọc phân loại */}
          <div className="mt-3 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <button
              type="button"
              onClick={() => setRoomFilter("all")}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                roomFilter === "all"
                  ? "bg-[#e7f3ff] text-[#0068ff]"
                  : "text-slate-600 hover:bg-slate-100",
              ].join(" ")}
            >
              Tất cả ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setRoomFilter("unread")}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                roomFilter === "unread"
                  ? "bg-[#e7f3ff] text-[#0068ff]"
                  : "text-slate-600 hover:bg-slate-100",
              ].join(" ")}
            >
              <span>Chưa đọc</span>
              {unreadRoomsCount > 0 ? (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {unreadRoomsCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setRoomFilter("priority")}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                roomFilter === "priority"
                  ? "bg-[#e7f3ff] text-[#0068ff]"
                  : "text-slate-600 hover:bg-slate-100",
              ].join(" ")}
            >
              Ưu tiên
            </button>
          </div>
        </div>

        {/* Danh sách phòng chat */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl p-2.5">
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icon icon="mdi:message-text-outline" width={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {roomSearch || roomFilter !== "all"
                  ? "Không tìm thấy cuộc trò chuyện phù hợp"
                  : "Chưa có hội thoại hỗ trợ nào"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {roomSearch || roomFilter !== "all"
                  ? "Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm."
                  : "Khi khách hàng nhắn tin từ cửa hàng, cuộc trò chuyện sẽ xuất hiện ngay tại đây."}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredRooms.map((room) => {
                const isSelected = activeRoomId === room.id;
                const hasUnread = room.unreadCount > 0;
                const lastMsg = room.lastMessage;
                const isLastFromMe = lastMsg?.senderId === user?.id;
                const timeLabel = formatRelativeTime(lastMsg?.created ?? room.created);

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setActiveRoomId(room.id);
                      setMobileShowChat(true);
                    }}
                    className={[
                      "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                      isSelected
                        ? "bg-[#e7f3ff]/90 text-slate-950"
                        : "bg-white text-slate-800 hover:bg-slate-100/80",
                    ].join(" ")}
                  >
                    {isSelected ? (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#0068ff]" />
                    ) : null}

                    <ChatAvatar
                      name={room.customerName}
                      avatar={room.customerAvatar}
                      isOnline={room.customerIsOnline}
                      size="lg"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={[
                            "truncate text-[14px]",
                            hasUnread ? "font-bold text-slate-950" : "font-semibold text-slate-900",
                          ].join(" ")}
                        >
                          {room.customerName}
                        </span>
                        <span
                          className={[
                            "shrink-0 text-[11px]",
                            hasUnread ? "font-semibold text-[#0068ff]" : "text-slate-400",
                          ].join(" ")}
                        >
                          {timeLabel}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p
                          className={[
                            "truncate text-[13px]",
                            hasUnread
                              ? "font-semibold text-slate-900"
                              : "font-normal text-slate-500",
                          ].join(" ")}
                        >
                          {lastMsg ? (
                            <>
                              {isLastFromMe ? (
                                <span className="text-slate-400">Bạn: </span>
                              ) : null}
                              {lastMsg.message}
                            </>
                          ) : (
                            <span className="italic text-slate-400">Bắt đầu trò chuyện...</span>
                          )}
                        </p>

                        <div className="flex shrink-0 items-center gap-1">
                          {room.priority === "High" ? (
                            <span
                              className="inline-flex h-4 items-center rounded bg-rose-50 px-1 text-[10px] font-semibold text-rose-600 ring-1 ring-inset ring-rose-200"
                              title="Ưu tiên cao"
                            >
                              Gấp
                            </span>
                          ) : null}

                          {hasUnread ? (
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0068ff] px-1.5 text-[11px] font-bold text-white">
                              {room.unreadCount > 99 ? "99+" : room.unreadCount}
                            </span>
                          ) : isLastFromMe && lastMsg?.isRead ? (
                            <ChatAvatar
                              name={room.customerName}
                              avatar={room.customerAvatar}
                              size="xs"
                            />
                          ) : isLastFromMe ? (
                            <Icon
                              icon="mdi:check-circle-outline"
                              width={14}
                              className="text-slate-400"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* CỘT GIỮA: KHUNG CHAT CHÍNH (ZALO / MESSENGER CANVAS) */}
      <section
        className={[
          "flex min-w-0 flex-1 w-full flex-col bg-[#eef0f3]",
          !mobileShowChat ? "hidden lg:flex" : "flex",
        ].join(" ")}
      >
        {activeRoom ? (
          <>
            {/* Header hội thoại */}
            <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 lg:hidden"
                  aria-label="Quay lại danh sách"
                >
                  <Icon icon="mdi:arrow-left" width={22} />
                </button>

                <ChatAvatar
                  name={activeRoom.customerName}
                  avatar={activeRoom.customerAvatar}
                  isOnline={activeRoom.customerIsOnline}
                  size="md"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[15px] font-bold text-slate-900">
                      {activeRoom.customerName}
                    </h2>
                    {activeRoom.priority === "High" ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 ring-1 ring-inset ring-rose-200">
                        Ưu tiên cao
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span
                      className={[
                        "inline-block h-1.5 w-1.5 rounded-full",
                        activeRoom.customerIsOnline ? "bg-emerald-500" : "bg-slate-300",
                      ].join(" ")}
                    />
                    <span className="truncate">
                      {formatLastSeen(activeRoom.customerLastSeen, activeRoom.customerIsOnline)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="hidden truncate sm:inline">{activeRoom.customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons bên phải Header */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMessageSearchOpen((prev) => !prev);
                    setMessageSearchQuery("");
                  }}
                  className={[
                    "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                    messageSearchOpen
                      ? "bg-[#e7f3ff] text-[#0068ff]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                  title="Tìm tin nhắn trong hội thoại"
                  aria-label="Tìm tin nhắn"
                >
                  <Icon icon="mdi:magnify" width={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickReplies((prev) => !prev)}
                  className={[
                    "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                    showQuickReplies
                      ? "bg-[#e7f3ff] text-[#0068ff]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                  title="Ẩn/hiện câu trả lời nhanh"
                  aria-label="Câu trả lời nhanh"
                >
                  <Icon icon="mdi:lightning-bolt-outline" width={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowRightPanel((prev) => !prev)}
                  className={[
                    "hidden h-9 w-9 items-center justify-center rounded-full transition xl:inline-flex",
                    showRightPanel
                      ? "bg-[#e7f3ff] text-[#0068ff]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                  title="Thông tin hội thoại"
                  aria-label="Thông tin hội thoại"
                >
                  <Icon icon="mdi:dock-right" width={20} />
                </button>
              </div>
            </header>

            {/* Thanh tìm kiếm tin nhắn trong cuộc trò chuyện */}
            {messageSearchOpen ? (
              <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
                <Icon icon="mdi:magnify" width={18} className="text-slate-400" />
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  placeholder="Nhập nội dung cần tìm trong cuộc trò chuyện này..."
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
                />
                {messageSearchQuery ? (
                  <span className="text-xs font-medium text-slate-400">
                    {displayedMessages.length} kết quả
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setMessageSearchOpen(false);
                    setMessageSearchQuery("");
                  }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Icon icon="mdi:close" width={15} />
                </button>
              </div>
            ) : null}

            {/* Khu vực hiển thị tin nhắn */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScrollMessages}
              className="relative flex-1 overflow-y-auto px-3 py-4 sm:px-6"
            >
              {/* Card giới thiệu đầu cuộc trò chuyện (giống Messenger / Zalo) */}
              <div className="mx-auto mb-6 flex max-w-sm flex-col items-center text-center">
                <ChatAvatar
                  name={activeRoom.customerName}
                  avatar={activeRoom.customerAvatar}
                  isOnline={activeRoom.customerIsOnline}
                  size="xl"
                />
                <h3 className="mt-3 text-base font-bold text-slate-900">
                  {activeRoom.customerName}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">{activeRoom.customerEmail}</p>
                {activeRoom.customerPhone ? (
                  <p className="mt-0.5 text-xs text-slate-500">SĐT: {activeRoom.customerPhone}</p>
                ) : null}
                <span className="mt-2 rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-500 shadow-sm ring-1 ring-slate-200/70">
                  Khách hàng tại HauShop • Kênh hỗ trợ trực tuyến
                </span>
              </div>

              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-500">
                  <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[#0068ff] border-t-transparent" />
                  <span>Đang tải lịch sử trò chuyện...</span>
                </div>
              ) : displayedMessages.length === 0 ? (
                <div className="mx-auto my-8 max-w-xs rounded-2xl bg-white/90 p-5 text-center shadow-sm">
                  <p className="text-sm font-medium text-slate-700">
                    {messageSearchQuery
                      ? "Không tìm thấy tin nhắn nào khớp từ khóa."
                      : "Chưa có tin nhắn nào trong cuộc trò chuyện này."}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Hãy gửi lời chào hoặc chọn câu trả lời nhanh bên dưới để bắt đầu.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {displayedMessages.map((message, index) => {
                    const prev = index > 0 ? displayedMessages[index - 1] : null;
                    const next =
                      index < displayedMessages.length - 1 ? displayedMessages[index + 1] : null;

                    const showDateDivider = !prev || !isSameDay(prev.created, message.created);
                    const isFirstInGroup = !prev || !isGroupedWith(prev, message);
                    const isLastInGroup = !next || !isGroupedWith(message, next);
                    const mine = message.senderId === user?.id;
                    const isLastOwnMessage = message.id === lastOwnMessageId;

                    // Bo góc bong bóng chat thông minh như Messenger / Zalo
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
                        {showDateDivider ? (
                          <div className="my-4 flex items-center justify-center">
                            <span className="rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-sm">
                              {formatDateDivider(message.created)}
                            </span>
                          </div>
                        ) : null}

                        <div
                          className={[
                            "flex items-end gap-2",
                            mine ? "justify-end" : "justify-start",
                            isFirstInGroup ? "mt-3" : "mt-0.5",
                          ].join(" ")}
                        >
                          {/* Avatar người gửi bên trái (chỉ hiện ở tin cuối của chuỗi) */}
                          {!mine ? (
                            <div className="w-7 shrink-0">
                              {isLastInGroup ? (
                                <ChatAvatar
                                  name={message.senderName || activeRoom.customerName}
                                  avatar={message.senderAvatar ?? activeRoom.customerAvatar}
                                  size="sm"
                                />
                              ) : null}
                            </div>
                          ) : null}

                          <div
                            className={[
                              "group relative flex max-w-[78%] flex-col sm:max-w-[68%]",
                              mine ? "items-end" : "items-start",
                            ].join(" ")}
                          >
                            {!mine && isFirstInGroup ? (
                              <span className="mb-1 ml-1 text-[11px] font-medium text-slate-500">
                                {message.senderName || activeRoom.customerName}
                              </span>
                            ) : null}

                            <div
                              className={[
                                "relative px-3.5 py-2.5 text-[14px] leading-[1.45] transition",
                                bubbleRadius,
                                mine
                                  ? "bg-gradient-to-br from-[#0084ff] to-[#0068ff] text-white shadow-[0_2px_8px_rgba(0,104,255,0.2)]"
                                  : "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60",
                              ].join(" ")}
                              title={new Date(message.created).toLocaleString("vi-VN")}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.message}</p>

                              {isLastInGroup ? (
                                <span
                                  className={[
                                    "mt-1 block text-[10px] select-none",
                                    mine ? "text-right text-blue-100/90" : "text-slate-400",
                                  ].join(" ")}
                                >
                                  {new Date(message.created).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              ) : null}
                            </div>

                            {/* Trạng thái Đã gửi / Đã xem giống Messenger / Zalo */}
                            {mine && isLastOwnMessage ? (
                              <div className="mt-1 flex items-center gap-1 pr-0.5 text-[11px] text-slate-500">
                                {message.isRead ? (
                                  <>
                                    <span>Đã xem</span>
                                    <ChatAvatar
                                      name={activeRoom.customerName}
                                      avatar={activeRoom.customerAvatar}
                                      size="xs"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <Icon
                                      icon="mdi:check-circle"
                                      width={13}
                                      className="text-[#0068ff]"
                                    />
                                    <span>Đã gửi</span>
                                  </>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Nút nổi cuộn xuống cuối */}
              {showScrollBottom ? (
                <button
                  type="button"
                  onClick={() => scrollToBottom("smooth")}
                  className="sticky bottom-3 left-1/2 z-20 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0068ff] shadow-[0_6px_20px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 transition hover:bg-blue-50"
                >
                  <Icon icon="mdi:arrow-down" width={15} />
                  <span>Cuộn xuống mới nhất</span>
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="flex items-center justify-between border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-2 text-rose-500 hover:text-rose-800"
                >
                  <Icon icon="mdi:close" width={15} />
                </button>
              </div>
            ) : null}

            {/* Thanh gợi ý câu trả lời nhanh (Quick Replies) */}
            {showQuickReplies ? (
              <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200/80 bg-white px-3 py-2">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#0068ff]">
                  <Icon icon="mdi:lightning-bolt" width={13} />
                  Nhanh
                </span>
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => {
                      setText(reply);
                      textareaRef.current?.focus();
                    }}
                    className="max-w-[240px] shrink-0 truncate rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs text-slate-600 transition hover:border-[#0068ff]/40 hover:bg-[#e7f3ff] hover:text-[#0068ff]"
                    title={reply}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Khung nhập tin nhắn (Composer) phong cách Messenger / Zalo */}
            <form
              onSubmit={onSubmit}
              className="relative flex items-end gap-2 border-t border-slate-200/80 bg-white px-3 py-2.5 sm:px-4"
            >
              {/* Emoji Picker Popover */}
              <div ref={emojiPickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={[
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition",
                    showEmojiPicker
                      ? "bg-[#e7f3ff] text-[#0068ff]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#0068ff]",
                  ].join(" ")}
                  title="Chèn biểu tượng cảm xúc"
                  aria-label="Chèn biểu tượng cảm xúc"
                >
                  <Icon icon="mdi:emoticon-happy-outline" width={22} />
                </button>

                {showEmojiPicker ? (
                  <div className="absolute bottom-12 left-0 z-30 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Biểu tượng cảm xúc
                    </p>
                    <div className="grid grid-cols-6 gap-1">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setText((prev) => `${prev}${emoji}`);
                            setShowEmojiPicker(false);
                            textareaRef.current?.focus();
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition hover:bg-slate-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Ô nhập văn bản bo tròn */}
              <div className="flex min-h-[40px] flex-1 items-center rounded-2xl border border-transparent bg-[#f0f2f5] px-3.5 py-2 transition focus-within:border-[#0068ff]/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0068ff]/15">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    event.target.style.height = "auto";
                    event.target.style.height = `${Math.min(event.target.scrollHeight, 112)}px`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitMessage();
                    }
                  }}
                  rows={1}
                  maxLength={5000}
                  placeholder={`Nhắn tin tới ${activeRoom.customerName}...`}
                  className="max-h-28 w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Nút Gửi hoặc Nút Like nhanh (👍) giống Messenger / Zalo */}
              {text.trim().length > 0 ? (
                <button
                  type="submit"
                  disabled={!canSend}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0068ff] text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Gửi tin nhắn"
                  title="Gửi tin nhắn (Enter)"
                >
                  <Icon icon="mdi:send" width={19} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={status !== "connected"}
                  onClick={() => void sendDirectMessage("👍")}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Gửi biểu tượng thích"
                  title="Gửi nhanh 👍"
                >
                  👍
                </button>
              )}
            </form>
          </>
        ) : (
          /* Trạng thái chưa chọn hội thoại */
          <div className="m-auto flex max-w-sm flex-col items-center px-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0068ff] shadow-md">
              <Icon icon="mdi:chat-processing-outline" width={42} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Chào mừng đến với HauShop Chat
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Chọn một cuộc trò chuyện ở danh sách bên trái để phản hồi khách hàng theo thời gian thực.
            </p>
          </div>
        )}
      </section>

      {/* CỘT PHẢI: THÔNG TIN HỘI THOẠI & KHÁCH HÀNG (ZALO / MESSENGER SIDEBAR) */}
      {activeRoom && showRightPanel ? (
        <aside className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-slate-200/80 bg-white xl:flex">
          {/* Hồ sơ khách hàng */}
          <div className="flex flex-col items-center border-b border-slate-100 px-5 py-6 text-center">
            <ChatAvatar
              name={activeRoom.customerName}
              avatar={activeRoom.customerAvatar}
              isOnline={activeRoom.customerIsOnline}
              size="xl"
            />
            <h3 className="mt-3 text-base font-bold text-slate-900">
              {activeRoom.customerName}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatLastSeen(activeRoom.customerLastSeen, activeRoom.customerIsOnline)}
            </p>

            {/* Nút thao tác nhanh dưới Avatar giống Messenger */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => void handleCopy("email", activeRoom.customerEmail)}
                className="flex flex-col items-center gap-1 text-xs text-slate-600 transition hover:text-[#0068ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-[#e7f3ff]">
                  <Icon icon="mdi:content-copy" width={17} />
                </span>
                <span>{copiedField === "email" ? "Đã chép" : "Chép Email"}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/orders")}
                className="flex flex-col items-center gap-1 text-xs text-slate-600 transition hover:text-[#0068ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-[#e7f3ff]">
                  <Icon icon="mdi:clipboard-text-search-outline" width={18} />
                </span>
                <span>Đơn hàng</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessageSearchOpen(true);
                }}
                className="flex flex-col items-center gap-1 text-xs text-slate-600 transition hover:text-[#0068ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-[#e7f3ff]">
                  <Icon icon="mdi:magnify" width={18} />
                </span>
                <span>Tìm kiếm</span>
              </button>
            </div>
          </div>

          {/* Chi tiết khách hàng & Ticket */}
          <div className="space-y-4 p-4">
            <div className="rounded-xl bg-slate-50/90 p-3.5 ring-1 ring-slate-200/70">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Thông tin khách hàng
              </h4>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="truncate font-medium text-slate-800" title={activeRoom.customerEmail}>
                    {activeRoom.customerEmail}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="font-medium text-slate-800">
                    {activeRoom.customerPhone || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Trạng thái phiếu:</span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0068ff]">
                    {activeRoom.status === "Open"
                      ? "Đang mở"
                      : activeRoom.status === "InProgress"
                        ? "Đang hỗ trợ"
                        : activeRoom.status === "Waiting"
                          ? "Chờ nhân viên"
                          : activeRoom.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Mức ưu tiên:</span>
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      activeRoom.priority === "High"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-slate-200/70 text-slate-700",
                    ].join(" ")}
                  >
                    {activeRoom.priority === "High"
                      ? "Cao"
                      : activeRoom.priority === "Low"
                        ? "Thấp"
                        : "Trung bình"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Tổng tin nhắn:</span>
                  <span className="font-semibold text-slate-800">{messages.length}</span>
                </div>
              </div>
            </div>

            {/* Ghi chú nội bộ của nhân viên cho khách hàng này */}
            <div className="rounded-xl bg-amber-50/60 p-3.5 ring-1 ring-amber-200/70">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <Icon icon="mdi:note-edit-outline" width={15} />
                  Ghi chú CSKH
                </h4>
                <span className="text-[10px] text-amber-600">Tự động lưu</span>
              </div>
              <textarea
                value={roomNotes[activeRoom.id] ?? ""}
                onChange={(e) => handleNoteChange(activeRoom.id, e.target.value)}
                rows={3}
                placeholder="Ghi chú mã đơn hàng, SĐT hoặc yêu cầu đặc biệt của khách..."
                className="mt-2 w-full resize-none rounded-lg border border-amber-200/80 bg-white p-2 text-xs text-slate-700 outline-none focus:border-amber-400"
              />
            </div>

            {/* Mẫu câu trả lời nhanh */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Mẫu câu phản hồi nhanh
              </h4>
              <div className="space-y-1.5">
                {QUICK_REPLIES.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setText(template);
                      textareaRef.current?.focus();
                    }}
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-left text-xs leading-5 text-slate-600 transition hover:border-[#0068ff]/40 hover:bg-[#e7f3ff]/60 hover:text-slate-900"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
