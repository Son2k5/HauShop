export type ChatMessageType = "Text" | "Image" | "System";

export interface ChatMessageDto {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  messageType: ChatMessageType;
  isRead: boolean;
  readAt: string | null;
  created: string;
}

export interface ChatRoomDto {
  id: string;
  name: string;
  type: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  assignedToId?: string | null;
  status: string;
  priority: string;
  unreadCount: number;
  lastMessage?: ChatMessageDto | null;
  created: string;
  closedAt?: string | null;
}

export interface SendChatMessageDto {
  chatRoomId: string;
  message: string;
  messageType?: ChatMessageType;
}
