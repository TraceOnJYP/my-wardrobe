import type { WardrobeItem } from "@/types/item";

export interface OotdRecord {
  id: string;
  wearDate: string;
  recordType?: "daily" | "look";
  displayOrder?: number;
  scenario?: string;
  notes?: string;
  itemIds: string[];
  imageUrl?: string;
  itemTitles: string[];
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
    >
  >;
}
