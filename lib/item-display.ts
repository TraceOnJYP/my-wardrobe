import type { WardrobeItem } from "@/types/item";

const GENERIC_CATEGORY_BY_TYPE: Record<string, string[]> = {
  clothing: ["服饰", "clothing"],
  accessory: ["配饰", "accessory", "accessories"],
  bag: ["包", "bag", "bags"],
  shoes: ["鞋", "鞋类", "shoes"],
  jewelry: ["首饰", "jewelry"],
};

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
  return joinParts([item.brand ?? unknownBrand, item.color ?? noColor, getItemDisplayCategory(item)]) || item.name;
}

export function getItemDisplaySubtitle(item: WardrobeItem) {
  return joinMeta([
    item.designElements,
    item.season.length > 0 ? item.season.join("/") : undefined,
    item.price !== undefined ? String(item.price) : undefined,
  ]);
}

export function getItemDisplayCategory(item: WardrobeItem) {
  const category = item.category?.trim();
  const subcategory = item.subcategory?.trim();
  const genericValues = item.itemType ? GENERIC_CATEGORY_BY_TYPE[item.itemType] ?? [] : [];

  if (subcategory && category && genericValues.includes(category.toLowerCase())) {
    return subcategory;
  }

  return category ?? subcategory ?? "";
}
