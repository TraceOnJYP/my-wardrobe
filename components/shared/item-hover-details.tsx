import type { WardrobeItem } from "@/types/item";

interface ItemHoverLabels {
  brand: string;
  category: string;
  color: string;
  designElements: string;
  material: string;
  season: string;
  tags: string;
  price: string;
  empty: string;
}

export function ItemHoverDetails({
  item,
  labels,
}: {
  item: WardrobeItem;
  labels: ItemHoverLabels;
}) {
  const rows = [
    { label: labels.brand, value: item.brand },
    {
      label: labels.category,
      value: [item.category, item.subcategory].filter(Boolean).join(" / "),
    },
    { label: labels.color, value: item.color },
    { label: labels.designElements, value: item.designElements },
    { label: labels.material, value: item.material },
    { label: labels.season, value: item.season.join(" / ") },
    { label: labels.tags, value: item.tags.join(" / ") },
    { label: labels.price, value: item.price !== undefined ? String(item.price) : undefined },
  ].filter((row) => row.value && row.value.trim() !== "");

  return (
    <div className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[90] hidden min-w-[240px] max-w-[320px] rounded-[18px] border border-white/80 bg-[rgba(255,252,248,0.98)] p-3 shadow-[0_16px_35px_rgba(77,57,36,0.16)] backdrop-blur-xl group-hover/details:block">
      <div className="space-y-1.5 text-xs leading-5 text-[hsl(var(--foreground))]">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[56px_1fr] gap-2">
              <div className="text-[hsl(var(--muted-foreground))]">{row.label}</div>
              <div className="break-words font-medium">{row.value}</div>
            </div>
          ))
        ) : (
          <div className="text-[hsl(var(--muted-foreground))]">{labels.empty}</div>
        )}
      </div>
    </div>
  );
}
