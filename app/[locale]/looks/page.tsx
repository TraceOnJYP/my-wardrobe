import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { LookListShell } from "@/components/looks/look-list-shell";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getOotdRecords } from "@/features/ootd/api";
import type { Locale } from "@/features/i18n/routing";
import { getOptionalCurrentUser } from "@/lib/auth/current-user";
import { isAuthConfigured } from "@/lib/auth/provider-config";

export default async function LooksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ scenario?: string }>;
}) {
  const { locale } = await params;
  const { scenario = "all" } = await searchParams;
  const dict = await getDictionary(locale);
  const currentUser = await getOptionalCurrentUser();

  if (isAuthConfigured() && !currentUser) {
    return (
      <AuthRequiredCard
        action={dict.auth.required.action}
        callbackUrl={`/${locale}/looks`}
        locale={locale}
        subtitle={dict.auth.required.ootdSubtitle}
        title={dict.auth.required.title}
      />
    );
  }

  const looks = await getOotdRecords(locale, "look");

  return (
    <LookListShell
      locale={locale}
      records={looks.data}
      initialScenario={scenario}
      labels={{
        ...dict.looks,
        allScenarios: locale === "zh-CN" ? "全部场景" : "All scenarios",
        scenarioOptions: dict.ootd.composer.scenarioOptions,
      }}
    />
  );
}
