import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3 text-sm outline-none",
        className,
      )}
      {...props}
    />
  );
}
