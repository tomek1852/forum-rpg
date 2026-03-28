import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-32 w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-[color:var(--foreground)] shadow-sm outline-none transition-colors placeholder:text-[color:var(--foreground-subtle)] focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--ring)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
