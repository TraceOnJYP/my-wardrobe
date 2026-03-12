import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import Link from "next/link";
import { ExcelImportPanel } from "@/components/import/excel-import-panel";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { SectionHeader } from "@/components/shared/section-header";
import { ItemForm } from "@/components/wardrobe/item-form";
import type { Locale } from "@/features/i18n/routing";
import { isAuthConfigured } from "@/lib/auth/provider-config";
import { getOptionalCurrentUser } from "@/lib/auth/current-user";

export default async function NewWardrobeItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ mode?: "manual" | "import" }>;
}) {
  const { locale } = await params;
  const { mode = "manual" } = await searchParams;
  const dict = await getDictionary(locale);
  const currentUser = await getOptionalCurrentUser();

  if (isAuthConfigured() && !currentUser) {
    return (
      <div className="space-y-6">
        <SectionHeader title={dict.wardrobe.newTitle} subtitle={dict.wardrobe.newSubtitle} />
        <AuthRequiredCard
          action={dict.auth.required.action}
          callbackUrl={`/${locale}/wardrobe/new?mode=${mode}`}
          locale={locale}
          subtitle={dict.auth.required.wardrobeSubtitle}
          title={dict.auth.required.title}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.wardrobe.newTitle} subtitle={dict.wardrobe.newSubtitle} />
      <div className="rounded-[30px] border border-white/60 bg-white/55 p-4 shadow-[0_12px_30px_rgba(77,57,36,0.06)] backdrop-blur-xl">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href={`/${locale}/wardrobe/new?mode=manual`}
            className={
              mode === "manual"
                ? "rounded-[22px] bg-[hsl(var(--primary))] px-4 py-3 text-center text-sm font-medium text-[hsl(var(--primary-foreground))]"
                : "rounded-[22px] border border-white/70 bg-white/80 px-4 py-3 text-center text-sm font-medium"
            }
          >
            {dict.wardrobe.modules.manual}
          </Link>
          <Link
            href={`/${locale}/wardrobe/new?mode=import`}
            className={
              mode === "import"
                ? "rounded-[22px] bg-[hsl(var(--primary))] px-4 py-3 text-center text-sm font-medium text-[hsl(var(--primary-foreground))]"
                : "rounded-[22px] border border-white/70 bg-white/80 px-4 py-3 text-center text-sm font-medium"
            }
          >
            {dict.wardrobe.modules.import}
          </Link>
        </div>
      </div>
      {mode === "import" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-white/60 bg-white/60 p-6 shadow-[0_12px_30px_rgba(77,57,36,0.06)] backdrop-blur-xl">
            <div className="mb-4 text-lg font-semibold">{dict.import.uploadTitle}</div>
            <div className="mb-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {dict.import.uploadDescription}
            </div>
            <ExcelImportPanel locale={locale} labels={dict.import.panel} />
          </div>
          <div className="rounded-[30px] border border-white/60 bg-white/60 p-6 shadow-[0_12px_30px_rgba(77,57,36,0.06)] backdrop-blur-xl">
            <div className="mb-4 text-lg font-semibold">{dict.import.templateTitle}</div>
            <div className="mb-5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {dict.import.templateDescription}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/templates/wardrobe-import-template.xlsx"
                className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
              >
                {dict.import.downloadTemplate}
              </Link>
              <Link
                href={`/${locale}/wardrobe/new?mode=manual`}
                className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium"
              >
                {dict.import.goManual}
              </Link>
            </div>
            <div className="mt-5 rounded-[24px] border border-white/70 bg-white/70 p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {dict.import.templateFields}
            </div>
          </div>
        </div>
      ) : (
        <ItemForm dict={dict.wardrobe.form} />
      )}
    </div>
  );
}
