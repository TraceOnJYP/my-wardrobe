import { SignOutButton } from "@/components/auth/sign-out-button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { AccountProviderList } from "@/components/profile/account-provider-list";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { Locale } from "@/features/i18n/routing";
import { getOptionalCurrentUser } from "@/lib/auth/current-user";
import { getSessionUser } from "@/lib/auth/session";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const user = await getSessionUser();
  const currentUser = await getOptionalCurrentUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <SectionHeader title={dict.profile.title} subtitle={dict.profile.loginRequired} />
        <Link href={`/${locale}/login`}>
          <Button>{dict.profile.loginAction}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.profile.title} subtitle={dict.profile.subtitle} />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{dict.profile.accountTitle}</div>
              <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{dict.profile.accountSubtitle}</div>
            </div>
            {currentUser ? <SignOutButton callbackUrl={`/${locale}/login`} label={dict.profile.signOut} /> : null}
          </div>
          <ProfileSummary user={user} />
        </Card>

        <AccountProviderList
          emptyText={dict.profile.noProviders}
          labels={dict.profile.providerLabels}
          providers={(currentUser?.accounts.map((account) => account.provider) ?? []) as Array<
            "google" | "apple" | "wechat"
          >}
          title={dict.profile.providersTitle}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <div>
            <div className="text-sm font-semibold">{dict.profile.preferencesTitle}</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {dict.profile.preferencesSubtitle}
            </div>
          </div>

          <div className="grid gap-3 rounded-[22px] border border-white/70 bg-white/72 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{dict.profile.languageTitle}</div>
                <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {dict.profile.languageSubtitle}
                </div>
              </div>
              <LocaleSwitcher currentLocale={locale} label={locale === "zh-CN" ? "English" : "中文"} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(217,204,191,0.6)] pt-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{dict.profile.timezoneTitle}</div>
                <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {dict.profile.timezoneSubtitle}
                </div>
              </div>
              <div className="rounded-full border border-white/80 bg-white px-3 py-1.5 text-xs font-medium">
                {currentUser?.timezone ?? user.timezone}
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <div className="text-sm font-semibold">{dict.profile.dataTitle}</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{dict.profile.dataSubtitle}</div>
          </div>

          <div className="grid gap-3 rounded-[22px] border border-white/70 bg-white/72 p-4 text-sm">
            <div>
              <div className="font-medium">{dict.profile.scopeTitle}</div>
              <div className="mt-1 leading-6 text-[hsl(var(--muted-foreground))]">{dict.profile.scopeBody}</div>
            </div>
            <div className="border-t border-[rgba(217,204,191,0.6)] pt-3">
              <div className="font-medium">{dict.profile.demoMigrationTitle}</div>
              <div className="mt-1 leading-6 text-[hsl(var(--muted-foreground))]">
                {dict.profile.demoMigrationBody}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
