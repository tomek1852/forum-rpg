"use client";

import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/lib/presence-realtime";
import { getPresenceLabel } from "@/lib/presence-realtime";

interface PresenceBadgeProps {
  status: PresenceStatus | undefined;
  showLabel?: boolean;
  className?: string;
}

const dotClass: Record<string, string> = {
  ONLINE: "bg-green-500",
  AWAY: "bg-yellow-400",
  OFFLINE: "bg-gray-400",
};

export function PresenceBadge({
  status,
  showLabel = false,
  className,
}: PresenceBadgeProps) {
  const resolved = status ?? "OFFLINE";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", dotClass[resolved])}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-sm text-[color:var(--foreground-muted)]">
          {getPresenceLabel(resolved)}
        </span>
      )}
    </span>
  );
}
