import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import Link from "next/link";
import { OotdCandidateBuilder } from "@/components/ootd/ootd-candidate-builder";
import { SectionHeader } from "@/components/shared/section-header";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getOotdRecords } from "@/features/ootd/api";
import type { Locale } from "@/features/i18n/routing";
import { getOptionalCurrentUser } from "@/lib/auth/current-user";
import { isAuthConfigured } from "@/lib/auth/provider-config";

export default async function OotdCandidatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { locale } = await params;
  const { day } = await searchParams;
  const dict = await getDictionary(locale);
  const currentUser = await getOptionalCurrentUser();

  if (isAuthConfigured() && !currentUser) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeader title={dict.ootd.candidates.pageTitle} subtitle={dict.ootd.candidates.pageSubtitle} />
          <Link
            href={`/${locale}/ootd`}
            className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium"
          >
            {dict.ootd.candidates.back}
          </Link>
        </div>
        <AuthRequiredCard
          action={dict.auth.required.action}
          callbackUrl={`/${locale}/ootd/candidates${day ? `?day=${day}` : ""}`}
          locale={locale}
          subtitle={dict.auth.required.ootdSubtitle}
          title={dict.auth.required.title}
        />
      </div>
    );
  }

  const records = await getOotdRecords(locale);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SectionHeader title={dict.ootd.candidates.pageTitle} subtitle={dict.ootd.candidates.pageSubtitle} />
        <Link
          href={`/${locale}/ootd`}
          className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium"
        >
          {dict.ootd.candidates.back}
        </Link>
      </div>
      <OotdCandidateBuilder
        locale={locale}
        records={records.data}
        initialWearDate={day}
        labels={{ ...dict.ootd.candidates, composer: dict.ootd.composer }}
      />
    </div>
  );
}
