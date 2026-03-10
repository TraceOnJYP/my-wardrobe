import { notFound } from "next/navigation";
import { OotdDetailShell } from "@/components/ootd/ootd-detail-shell";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { Locale } from "@/features/i18n/routing";
import { ootdService } from "@/server/services/ootd.service";

export default async function OotdDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale, id } = await params;
  const { month } = await searchParams;
  const dict = await getDictionary(locale);
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const record = await ootdService.getRecord({ userId: user.id, recordId: id });
  if (!record) {
    notFound();
  }

  return <OotdDetailShell locale={locale} month={month} record={record} labels={dict.ootd.detail} pageTitle={dict.ootd.title} />;
}
