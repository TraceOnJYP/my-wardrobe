import Link from "next/link";
import { notFound } from "next/navigation";
import { OotdCandidateBuilder } from "@/components/ootd/ootd-candidate-builder";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { Locale } from "@/features/i18n/routing";
import { getItems } from "@/features/wardrobe/api";
import { getSessionUser } from "@/lib/auth/session";
import { ootdService } from "@/server/services/ootd.service";
import type { WardrobeItem } from "@/types/item";

export default async function OotdEditPage({
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

  const [record, wardrobe] = await Promise.all([
    ootdService.getRecord({ userId: user.id, recordId: id }),
    getItems(locale),
  ]);

  if (!record) {
    notFound();
  }

  const backHref = month ? `/${locale}/ootd/${id}?month=${month}` : `/${locale}/ootd/${id}`;
  const selectedItemsMap = new Map<string, WardrobeItem>();
  for (const item of wardrobe.data) {
    if (record.itemIds.includes(item.id)) {
      selectedItemsMap.set(item.id, item);
    }
  }
  for (const item of record.items) {
    if (!selectedItemsMap.has(item.id)) {
      selectedItemsMap.set(item.id, {
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        itemType: item.itemType,
        brand: item.brand,
        category: item.category ?? "",
        subcategory: item.subcategory,
        color: item.color,
        designElements: item.designElements,
        material: item.material,
        season: item.season ?? [],
        tags: item.tags ?? [],
        price: item.price,
        discardedAt: item.discardedAt,
        deletedAt: item.deletedAt,
        status: item.status,
        wearDays: 0,
        costPerWear: 0,
        updatedAt: record.wearDate,
      });
    }
  }
  const selectedItems = Array.from(selectedItemsMap.values());
  const composerLabels = {
    ...dict.ootd.composer,
    title: dict.ootd.detail.editTitle,
    subtitle: dict.ootd.detail.editSubtitle,
    save: dict.ootd.detail.saveEdit,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{dict.ootd.detail.editTitle}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{dict.ootd.detail.editSubtitle}</p>
        </div>
        <Link
          href={backHref}
          className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium"
        >
          {dict.ootd.detail.cancel}
        </Link>
      </div>

      <OotdCandidateBuilder
        locale={locale}
        records={[]}
        wardrobeItems={wardrobe.data}
        recordId={record.id}
        initialWearDate={record.wearDate}
        initialScenario={record.scenario}
        initialNotes={record.notes}
        initialImageUrl={record.imageUrl}
        initialSelectedIds={record.itemIds}
        initialPoolItems={selectedItems}
        labels={{
          ...dict.ootd.candidates,
          composer: composerLabels,
        }}
      />
    </div>
  );
}
