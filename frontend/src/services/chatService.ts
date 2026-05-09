import api from "../api/apiClient";
import type { ChatMessageDto, ChatRoomDto } from "../@types/chat.type";

export const chatService = {
  async startSupportChat(subject?: string): Promise<ChatRoomDto> {
    const response = await api.post<ChatRoomDto>("/chat/support/start", { subject });
    return response.data;
  },

  async getRooms(): Promise<ChatRoomDto[]> {
    const response = await api.get<ChatRoomDto[]>("/chat/rooms");
    return response.data;
  },

  async getMessages(roomId: string, take = 50): Promise<ChatMessageDto[]> {
    const response = await api.get<ChatMessageDto[]>(`/chat/rooms/${roomId}/messages`, {
      params: { take },
    });
    return response.data;
  },

  async markAsRead(roomId: string): Promise<void> {
    await api.post(`/chat/rooms/${roomId}/read`);
  },
};
