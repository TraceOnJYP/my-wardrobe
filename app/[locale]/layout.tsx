import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { locales, type Locale } from "@/features/i18n/routing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);
  const cookieStore = await cookies();
  const candidateCount = Number(cookieStore.get("smart-wardrobe-ootd-candidate-count")?.value ?? "0");

  return (
    <AppShell>
      <div className="grid gap-4 lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="flex h-full flex-col rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(255,255,255,0.3))] p-4 shadow-[0_16px_40px_rgba(77,57,36,0.08)] backdrop-blur-xl">
            <div className="border-b border-white/55 px-2 pb-5">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
                Smart Wardrobe
              </div>
              <div className="mt-3 text-[1.75rem] font-semibold leading-none tracking-tight">{dict.home.title}</div>
              <div className="mt-2 max-w-[17rem] text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {dict.layout.sidebarNote}
              </div>
            </div>

            <div className="pt-5">
              <Link
                href={`/${locale}/wardrobe/new`}
                className="block rounded-[20px] bg-[hsl(var(--primary))] px-4 py-3 text-center text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-[0_12px_28px_rgba(77,57,36,0.18)]"
              >
                {dict.layout.addItem}
              </Link>
            </div>

            <div className="mt-5 flex-1">
              <SidebarNav locale={locale as Locale} dict={dict.nav} />
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-white/55 px-2 pt-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {dict.layout.language}
              </div>
              <LocaleSwitcher
                currentLocale={locale as Locale}
                label={locale === "zh-CN" ? "English" : "中文"}
              />
            </div>
          </div>
        </aside>
        <main className="min-w-0 space-y-4 lg:grid lg:min-h-[calc(100vh-3rem)] lg:grid-rows-[auto_minmax(0,1fr)] lg:space-y-0 lg:gap-4">
          <Topbar
            locale={locale}
            title={dict.layout.topbarTitle}
            subtitle={dict.layout.topbarSubtitle}
            candidateLabel={dict.ootd.candidates.entry}
            candidateCount={Number.isNaN(candidateCount) ? 0 : candidateCount}
          />
          <div className="grid min-w-0 gap-4 lg:min-h-0">{children}</div>
        </main>
      </div>
    </AppShell>
  );
}
