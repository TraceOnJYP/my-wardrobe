import Link from "next/link";
import { notFound } from "next/navigation";
import { OotdCandidateBuilder } from "@/components/ootd/ootd-candidate-builder";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getItems } from "@/features/wardrobe/api";
import type { Locale } from "@/features/i18n/routing";
import { getSessionUser } from "@/lib/auth/session";
import { ootdService } from "@/server/services/ootd.service";
import type { WardrobeItem } from "@/types/item";

export default async function LookEditPage({
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

  const [record, wardrobe] = await Promise.all([
    ootdService.getRecord({ userId: user.id, recordId: id }),
    getItems(locale),
  ]);

  if (!record || record.recordType !== "look") {
    notFound();
  }

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
    title: dict.looks.editTitle,
    subtitle: dict.looks.editSubtitle,
    save: dict.looks.saveEdit,
    itemLimit: dict.looks.itemLimit,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{dict.looks.editTitle}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{dict.looks.editSubtitle}</p>
        </div>
        <Link
          href={`/${locale}/looks/${record.id}`}
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
        recordType="look"
        showWearDate={false}
      />
    </div>
  );
}
