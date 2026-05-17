"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { disconnectPresenceSocket, getPresenceSocket } from "./presence-socket";

export type PresenceStatus = "ONLINE" | "AWAY" | "OFFLINE";

const HEARTBEAT_INTERVAL_MS = 30_000;

export function usePresence({
  accessToken,
  hydrated,
  watchUserIds,
}: {
  accessToken: string | null;
  hydrated: boolean;
  watchUserIds: string[];
}) {
  const [statuses, setStatuses] = useState<Record<string, PresenceStatus>>({});
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchedRef = useRef<Set<string>>(new Set());

  const updateStatus = useCallback((userId: string, status: PresenceStatus) => {
    setStatuses((prev) => ({ ...prev, [userId]: status }));
  }, []);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      disconnectPresenceSocket();
      return;
    }

    const socket = getPresenceSocket(accessToken);
    socket.connect();

    const handleChanged = (event: { userId: string; status: PresenceStatus }) => {
      updateStatus(event.userId, event.status);
    };

    socket.on("presence:changed", handleChanged);

    heartbeatRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit("presence:heartbeat");
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      socket.off("presence:changed", handleChanged);

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      socket.disconnect();
    };
  }, [accessToken, hydrated, updateStatus]);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    const socket = getPresenceSocket(accessToken);

    const toWatch = watchUserIds.filter((id) => !watchedRef.current.has(id));
    const toUnwatch = [...watchedRef.current].filter(
      (id) => !watchUserIds.includes(id),
    );

    for (const userId of toUnwatch) {
      socket.emit("presence:unwatch", { userId });
      watchedRef.current.delete(userId);
    }

    for (const userId of toWatch) {
      socket.emit("presence:watch", { userId }, (response: { userId: string; status: PresenceStatus }) => {
        if (response?.userId) {
          updateStatus(response.userId, response.status);
        }
      });
      watchedRef.current.add(userId);
    }
  }, [accessToken, hydrated, watchUserIds, updateStatus]);

  return statuses;
}

export function getPresenceLabel(status: PresenceStatus | undefined): string {
  switch (status) {
    case "ONLINE":
      return "Online";
    case "AWAY":
      return "Nieaktywny";
    case "OFFLINE":
    default:
      return "Offline";
  }
}
