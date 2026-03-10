import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[28px] border border-white/50 bg-white/72 p-5 shadow-[0_10px_35px_rgba(77,57,36,0.08)] backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}
