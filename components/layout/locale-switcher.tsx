"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/features/i18n/routing";

export function LocaleSwitcher({
  currentLocale,
  label,
}: {
  currentLocale: Locale;
  label: string;
}) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(zh-CN|en-US)/, "");
  const nextLocale = currentLocale === "zh-CN" ? "en-US" : "zh-CN";

  return (
    <Link
      href={`/${nextLocale}${pathWithoutLocale || ""}`}
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-white/70 bg-white/78 px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] shadow-[0_8px_18px_rgba(77,57,36,0.08)] backdrop-blur-sm"
    >
      {label}
    </Link>
  );
}
