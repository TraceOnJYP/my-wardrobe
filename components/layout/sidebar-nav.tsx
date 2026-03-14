"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/features/i18n/routing";
import { cn } from "@/lib/utils/cn";

interface SidebarNavProps {
  locale: Locale;
  dict: Record<string, string>;
}

export function SidebarNav({ locale, dict }: SidebarNavProps) {
  const pathname = usePathname();
  const items = [
    { href: `/${locale}`, label: dict.home },
    { href: `/${locale}/wardrobe`, label: dict.wardrobe },
    { href: `/${locale}/ootd`, label: dict.ootd },
    { href: `/${locale}/looks`, label: dict.looks },
    { href: `/${locale}/insights`, label: dict.insights },
    { href: `/${locale}/profile`, label: dict.profile },
  ];

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const isActive =
          item.href === `/${locale}`
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "grid grid-cols-[0.5rem_minmax(0,1fr)] items-center gap-3 rounded-[20px] px-3 py-3 text-sm transition",
              isActive
                ? "bg-[rgba(255,255,255,0.92)] text-[hsl(var(--foreground))] shadow-[0_10px_22px_rgba(77,57,36,0.08)]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-white/70 hover:text-[hsl(var(--foreground))]",
            )}
          >
            <span
              className={cn(
                "h-8 w-1.5 rounded-full transition",
                isActive
                  ? "bg-[hsl(var(--primary))]"
                  : "bg-transparent",
              )}
            />
            <span className="truncate font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
