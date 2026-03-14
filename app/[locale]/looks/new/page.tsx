import Link from "next/link";
import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { OotdCandidateBuilder } from "@/components/ootd/ootd-candidate-builder";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getItems } from "@/features/wardrobe/api";
import type { Locale } from "@/features/i18n/routing";
import { getOptionalCurrentUser } from "@/lib/auth/current-user";
import { isAuthConfigured } from "@/lib/auth/provider-config";

export default async function NewLookPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const currentUser = await getOptionalCurrentUser();

  if (isAuthConfigured() && !currentUser) {
    return (
      <AuthRequiredCard
        action={dict.auth.required.action}
        callbackUrl={`/${locale}/looks/new`}
        locale={locale}
        subtitle={dict.auth.required.ootdSubtitle}
        title={dict.auth.required.title}
      />
    );
  }

  const wardrobe = await getItems(locale);
  const composerLabels = {
    ...dict.ootd.composer,
    title: dict.looks.newTitle,
    subtitle: dict.looks.newSubtitle,
    save: dict.looks.save,
    itemLimit: dict.looks.itemLimit,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{dict.looks.newTitle}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{dict.looks.newSubtitle}</p>
        </div>
        <Link
          href={`/${locale}/looks`}
          className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium"
        >
          {dict.looks.back}
        </Link>
      </div>

      <OotdCandidateBuilder
        locale={locale}
        records={[]}
        wardrobeItems={wardrobe.data}
        labels={{
          ...dict.ootd.candidates,
          composer: composerLabels,
        }}
        recordType="look"
        showWearDate={false}
      />
    </div>
  );
}
