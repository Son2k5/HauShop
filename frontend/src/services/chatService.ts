import type { ChatMessageDto, ChatRoomDto } from "../@types/chat.type";
import { http } from "../lib/http";

export const chatService = {
  async startSupportChat(subject?: string): Promise<ChatRoomDto> {
    return http.post<ChatRoomDto>("/chat/support/start", { subject });
  },

  async startAiChat(): Promise<ChatRoomDto> {
    return http.post<ChatRoomDto>("/chat/ai/start");
  },

  async getRooms(): Promise<ChatRoomDto[]> {
    return http.get<ChatRoomDto[]>("/chat/rooms");
  },

  async getMessages(roomId: string, take = 50): Promise<ChatMessageDto[]> {
    return http.get<ChatMessageDto[]>(`/chat/rooms/${roomId}/messages`, {
      params: { take },
    });
  },

  async markAsRead(roomId: string): Promise<void> {
    await http.post(`/chat/rooms/${roomId}/read`);
  },
};
