import type { WardrobeItem } from "@/types/item";
import { WardrobeGrid } from "@/components/wardrobe/wardrobe-grid";

export function SearchResults({
  items,
  labels,
}: {
  items: WardrobeItem[];
  labels: { unknownBrand: string; noColor: string };
}) {
  return <WardrobeGrid items={items} labels={labels} />;
}
