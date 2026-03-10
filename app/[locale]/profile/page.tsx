import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PreferenceForm } from "@/components/profile/preference-form";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { SyncStatusCard } from "@/components/profile/sync-status-card";
import { SectionHeader } from "@/components/shared/section-header";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { Locale } from "@/features/i18n/routing";
import { getSessionUser } from "@/lib/auth/session";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.profile.title} />
      <ProfileSummary user={user} />
      <LocaleSwitcher />
      <SyncStatusCard text={dict.profile.syncStatus} />
      <PreferenceForm text={dict.profile.preferencePlaceholder} />
    </div>
  );
}
