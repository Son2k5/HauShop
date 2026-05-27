import * as signalR from "@microsoft/signalr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessageDto, SendChatMessageDto } from "../@types/chat.type";
import { SIGNALR_HUB_URL } from "../lib/env";

export function useChatConnection({
  enabled,
  onMessage,
  onRoomUpdated,
}: {
  enabled: boolean;
  onMessage?: (message: ChatMessageDto) => void;
  onRoomUpdated?: (roomId: string) => void;
}) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");

  const connection = useMemo(() => {
    if (!enabled) return null;

    return new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }, [enabled]);

  useEffect(() => {
    if (!connection) return;

    let cancelled = false;
    connectionRef.current = connection;

    connection.on("ReceiveMessage", (message: ChatMessageDto) => onMessage?.(message));
    connection.on("RoomUpdated", (roomId: string) => onRoomUpdated?.(roomId));
    connection.onreconnecting(() => setStatus("connecting"));
    connection.onreconnected(() => setStatus("connected"));
    connection.onclose(() => setStatus("disconnected"));

    const start = async () => {
      try {
        setStatus("connecting");
        await connection.start();
        if (!cancelled) setStatus("connected");
      } catch {
        if (!cancelled) setStatus("disconnected");
      }
    };

    void start();

    return () => {
      cancelled = true;
      connection.off("ReceiveMessage");
      connection.off("RoomUpdated");
      void connection.stop();
      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
    };
  }, [connection, onMessage, onRoomUpdated]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return;
    await connectionRef.current.invoke("JoinRoom", roomId);
  }, []);

  const leaveRoom = useCallback(async (roomId: string) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return;
    await connectionRef.current.invoke("LeaveRoom", roomId);
  }, []);

  const sendMessage = useCallback(async (dto: SendChatMessageDto) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      throw new Error("Chat connection is not ready.");
    }
    await connectionRef.current.invoke("SendMessage", {
      chatRoomId: dto.chatRoomId,
      message: dto.message,
      messageType: dto.messageType ?? "Text",
    });
  }, []);

  const sendAiMessage = useCallback(async (dto: SendChatMessageDto) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      throw new Error("Chat connection is not ready.");
    }
    await connectionRef.current.invoke("SendAiMessage", {
      chatRoomId: dto.chatRoomId,
      message: dto.message,
      messageType: dto.messageType ?? "Text",
    });
  }, []);

  const markAsRead = useCallback(async (roomId: string) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return;
    await connectionRef.current.invoke("MarkAsRead", roomId);
  }, []);

  return { status, joinRoom, leaveRoom, sendMessage, sendAiMessage, markAsRead };
}
