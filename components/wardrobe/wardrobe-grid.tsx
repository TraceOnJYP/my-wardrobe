import type { WardrobeItem } from "@/types/item";
import { WardrobeItemCard } from "@/components/wardrobe/wardrobe-item-card";

export function WardrobeGrid({
  items,
  labels,
  locale,
  query,
}: {
  items: WardrobeItem[];
  labels: {
    unknownBrand: string;
    noColor: string;
    addToCandidate: string;
    addedToCandidate: string;
    removeFromCandidate: string;
    brand: string;
    category: string;
    color: string;
    designElements: string;
    material: string;
    season: string;
    tags: string;
    price: string;
    emptyDetails: string;
  };
  locale: string;
  query?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <WardrobeItemCard
          key={item.id}
          item={item}
          labels={labels}
          href={`/${locale}/wardrobe/${item.id}`}
          query={query}
        />
      ))}
    </div>
  );
}
