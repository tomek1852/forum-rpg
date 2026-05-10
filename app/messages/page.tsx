import { Suspense } from "react";
import { MessagesShell } from "@/components/messages/messages-shell";

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesShell />
    </Suspense>
  );
}
