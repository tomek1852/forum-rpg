import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-[color:var(--foreground)] shadow-sm outline-none transition-colors placeholder:text-[color:var(--foreground-subtle)] focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--ring)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
