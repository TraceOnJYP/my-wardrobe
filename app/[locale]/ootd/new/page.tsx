import { redirect } from "next/navigation";
import type { Locale } from "@/features/i18n/routing";

export default async function NewOotdPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/ootd`);
}
