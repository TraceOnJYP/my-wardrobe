import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
};

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
        variant === "default" && "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
        variant === "outline" && "border border-[hsl(var(--border))] bg-white",
        variant === "ghost" && "bg-transparent",
        variant === "destructive" &&
          "bg-[hsl(8_72%_56%)] text-white hover:bg-[hsl(8_72%_50%)] disabled:bg-[hsl(8_40%_72%)] disabled:text-white/90",
        className,
      )}
      {...props}
    />
  );
}
