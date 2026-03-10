import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3 text-sm outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
