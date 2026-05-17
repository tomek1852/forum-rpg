"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getPresenceSocket(accessToken: string) {
  if (!socket) {
    socket = io(getPresenceSocketUrl(), {
      autoConnect: false,
      transports: ["websocket"],
    });
  }

  socket.auth = {
    token: accessToken,
  };

  return socket;
}

export function disconnectPresenceSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
}

function getPresenceSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  const parsed = new URL(apiUrl);

  return `${parsed.origin}/presence-realtime`;
}
