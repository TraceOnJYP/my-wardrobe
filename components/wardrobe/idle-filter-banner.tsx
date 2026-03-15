"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function IdleFilterBanner({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const clearIdle = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("idle");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[rgba(214,154,97,0.36)] bg-[rgba(255,238,222,0.96)] px-4 py-3 text-sm font-semibold text-[hsl(var(--primary))] shadow-[0_10px_24px_rgba(77,57,36,0.06)]">
      <div>
        {locale === "zh-CN"
          ? "当前查看：近一年未在穿搭日历中出现的单品"
          : "Current view: items not worn in the outfit calendar in the last year"}
      </div>
      <button
        type="button"
        onClick={clearIdle}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(214,154,97,0.28)] bg-white/75 text-base leading-none text-[hsl(var(--primary))] transition hover:bg-white"
        aria-label={locale === "zh-CN" ? "关闭近一年未穿筛选" : "Close idle filter"}
      >
        ×
      </button>
    </div>
  );
}
