import { notFound } from "next/navigation";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { SectionHeader } from "@/components/shared/section-header";
import { ItemDetailShell } from "@/components/wardrobe/item-detail-shell";
import { getSessionUser } from "@/lib/auth/session";
import { wardrobeService } from "@/server/services/wardrobe.service";
import type { Locale } from "@/features/i18n/routing";

export default async function WardrobeItemPage({
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

  const item = await wardrobeService.getItem({ userId: user.id, itemId: id });
  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.wardrobe.detailTitle} subtitle={dict.wardrobe.detailSubtitle} />
      <ItemDetailShell
        item={item}
        itemId={id}
        locale={locale}
        formDict={dict.wardrobe.form}
        detailDict={dict.wardrobe.detail}
      />
    </div>
  );
}
