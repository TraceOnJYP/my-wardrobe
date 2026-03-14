import { notFound } from "next/navigation";
import { OotdDetailShell } from "@/components/ootd/ootd-detail-shell";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { Locale } from "@/features/i18n/routing";
import { getSessionUser } from "@/lib/auth/session";
import { ootdService } from "@/server/services/ootd.service";

export default async function LookDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const record = await ootdService.getRecord({ userId: user.id, recordId: id });
  if (!record || record.recordType !== "look") {
    notFound();
  }

  return (
    <OotdDetailShell
      locale={locale}
      record={record}
      labels={{
        ...dict.ootd.detail,
        title: dict.looks.detailTitle,
        subtitle: dict.looks.detailSubtitle,
        back: dict.looks.back,
        edit: dict.looks.edit,
      }}
      pageTitle={dict.looks.title}
      backHref={`/${locale}/looks`}
      editHref={`/${locale}/looks/${record.id}/edit`}
    />
  );
}
