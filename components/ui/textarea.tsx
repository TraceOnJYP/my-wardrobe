import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3 text-sm outline-none",
        className,
      )}
      {...props}
    />
  );
}
