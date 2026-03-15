import Link from "next/link";
import { AddToCandidatesButton } from "@/components/ootd/add-to-candidates-button";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { ItemHoverDetails } from "@/components/shared/item-hover-details";
import { Card } from "@/components/ui/card";
import { getItemDisplaySubtitle, getItemDisplayTitle } from "@/lib/item-display";
import type { WardrobeItem } from "@/types/item";

export function WardrobeItemCard({
  item,
  labels,
  href,
  query,
}: {
  item: WardrobeItem;
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
  href: string;
  query?: string;
}) {
  const title = getItemDisplayTitle(item, labels.unknownBrand, labels.noColor);
  const subtitle = getItemDisplaySubtitle(item) || `${item.brand ?? labels.unknownBrand} ${item.color ?? labels.noColor}`;

  return (
    <Card className="space-y-3 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(77,57,36,0.12)]">
      <Link href={href} className="block">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="aspect-[4/5] w-full rounded-[20px] object-cover"
          />
        ) : (
          <div className="aspect-[4/5] rounded-[20px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
        )}
        <div>
          {item.discardedAt ? (
            <div className="mb-2 inline-flex rounded-full border border-[rgba(198,185,171,0.72)] bg-[rgba(242,236,229,0.92)] px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
              {item.status === "discarded" ? `已丢弃 ${item.discardedAt}` : item.discardedAt}
            </div>
          ) : null}
          <div className="font-medium">
            <HighlightedText text={title} query={query} />
          </div>
          <div className="group/details relative inline-block max-w-full">
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              <HighlightedText text={subtitle} query={query} />
            </div>
            <ItemHoverDetails
              item={item}
              labels={{
                brand: labels.brand,
                category: labels.category,
                color: labels.color,
                designElements: labels.designElements,
                material: labels.material,
                season: labels.season,
                tags: labels.tags,
                price: labels.price,
                empty: labels.emptyDetails,
              }}
            />
          </div>
        </div>
      </Link>
      <AddToCandidatesButton
        item={item}
        labels={{
          add: labels.addToCandidate,
          added: labels.addedToCandidate,
          remove: labels.removeFromCandidate,
        }}
      />
    </Card>
  );
}
