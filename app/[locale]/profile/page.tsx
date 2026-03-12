import { SignOutButton } from "@/components/auth/sign-out-button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { AccountProviderList } from "@/components/profile/account-provider-list";
import { PreferenceForm } from "@/components/profile/preference-form";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { SyncStatusCard } from "@/components/profile/sync-status-card";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
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
      <SectionHeader title={dict.profile.title} />
      <ProfileSummary user={user} />
      <AccountProviderList
        emptyText={dict.profile.noProviders}
        labels={dict.profile.providerLabels}
        providers={(currentUser?.accounts.map((account) => account.provider) ?? []) as Array<
          "google" | "apple" | "wechat"
        >}
        title={dict.profile.providersTitle}
      />
      {currentUser ? <SignOutButton callbackUrl={`/${locale}/login`} label={dict.profile.signOut} /> : null}
      <LocaleSwitcher />
      <SyncStatusCard text={dict.profile.syncStatus} />
      <PreferenceForm text={dict.profile.preferencePlaceholder} />
    </div>
  );
}
