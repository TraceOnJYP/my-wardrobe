"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface WardrobeTypeOption {
  value: string;
  label: string;
}

export function WardrobeTypeNav({
  currentType,
  options,
}: {
  currentType: string;
  options: WardrobeTypeOption[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {options.map((option) => {
          const isActive = option.value === currentType;
          const next = new URLSearchParams(searchParams.toString());
          next.set("type", option.value);
          const href = `${pathname}?${next.toString()}`;

          return (
            <Link
              key={option.value}
              href={href}
              className={
                isActive
                  ? "rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
                  : "rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition hover:bg-white"
              }
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
