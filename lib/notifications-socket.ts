"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getNotificationsSocket(accessToken: string) {
  if (!socket) {
    socket = io(getNotificationsSocketUrl(), {
      autoConnect: false,
      transports: ["websocket"],
    });
  }

  socket.auth = {
    token: accessToken,
  };

  return socket;
}

export function disconnectNotificationsSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
}

function getNotificationsSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  const parsed = new URL(apiUrl);

  return `${parsed.origin}/notifications-realtime`;
}
