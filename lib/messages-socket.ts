"use client";

import { io, type Socket } from "socket.io-client";
import type { PrivateMessage } from "./types";

let socket: Socket | null = null;

type ConversationUpsertedEvent = {
  conversationId: string;
};

type MessageCreatedEvent = {
  conversationId: string;
  message: PrivateMessage;
};

type ConversationReadEvent = {
  conversationId: string;
  readByUserId: string;
};

export function getMessagesSocket(accessToken: string) {
  if (!socket) {
    socket = io(getMessagesSocketUrl(), {
      autoConnect: false,
      transports: ["websocket"],
    });
  }

  socket.auth = {
    token: accessToken,
  };

  return socket;
}

export function disconnectMessagesSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
}

export type MessagesSocketEventMap = {
  "messages:conversation-upserted": ConversationUpsertedEvent;
  "messages:message-created": MessageCreatedEvent;
  "messages:conversation-read": ConversationReadEvent;
};

function getMessagesSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  const parsed = new URL(apiUrl);

  return `${parsed.origin}/messages-realtime`;
}
