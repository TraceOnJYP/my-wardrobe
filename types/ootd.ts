import type { WardrobeItem } from "@/types/item";

export interface OotdRecord {
  id: string;
  wearDate: string;
  recordType?: "daily" | "look";
  sourceLookId?: string;
  displayOrder?: number;
  scenario?: string;
  notes?: string;
  itemIds: string[];
  imageUrl?: string;
  itemTitles: string[];
  usedDates?: string[];
  containsDeletedItems?: boolean;
  containsDiscardedItems?: boolean;
  items: Array<
    Pick<
      WardrobeItem,
      | "id"
      | "name"
      | "imageUrl"
      | "itemType"
      | "brand"
      | "category"
      | "subcategory"
      | "color"
      | "designElements"
      | "material"
      | "season"
      | "tags"
      | "price"
      | "discardedAt"
      | "deletedAt"
      | "status"
    >
  >;
}
