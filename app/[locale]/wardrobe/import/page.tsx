import { redirect } from "next/navigation";
import type { Locale } from "@/features/i18n/routing";

export default async function WardrobeImportPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/wardrobe/new?mode=import`);
}
