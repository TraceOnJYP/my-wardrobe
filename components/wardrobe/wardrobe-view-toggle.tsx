"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function WardrobeViewToggle({
  initialView,
  labels,
}: {
  initialView: "grid" | "list";
  labels: { grid: string; list: string };
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (view: "grid" | "list") => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("view", view);
    return `${pathname}?${next.toString()}`;
  };

  return (
    <div className="flex gap-2">
      {(["grid", "list"] as const).map((view) => (
        <Link
          key={view}
          href={hrefFor(view)}
          className={cn(
            "inline-flex rounded-full px-4 py-2 text-sm font-medium",
            initialView === view
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              : "border border-[hsl(var(--border))] bg-white",
          )}
        >
          {view === "grid" ? labels.grid : labels.list}
        </Link>
      ))}
    </div>
  );
}
