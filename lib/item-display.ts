import type { WardrobeItem } from "@/types/item";

function joinParts(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

function joinMeta(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

export function getItemDisplayTitle(item: WardrobeItem, unknownBrand: string, noColor: string) {
  return joinParts([item.brand ?? unknownBrand, item.color ?? noColor, item.subcategory ?? item.category]) || item.name;
}

export function getItemDisplaySubtitle(item: WardrobeItem) {
  return joinMeta([
    item.designElements,
    item.season.length > 0 ? item.season.join("/") : undefined,
    item.price !== undefined ? String(item.price) : undefined,
  ]);
}
