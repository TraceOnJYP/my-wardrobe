import Link from "next/link";

import { HighlightedText } from "@/components/shared/highlighted-text";
import { ItemHoverDetails } from "@/components/shared/item-hover-details";
import { Card } from "@/components/ui/card";
import type { WardrobeItem } from "@/types/item";

interface HighlightItem {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  href?: string;
  item?: WardrobeItem;
  showSubtitle?: boolean;
}

interface HighlightGroup {
  label: string;
  items: HighlightItem[];
}

export function HomeGuidanceCard({
  title,
  subtitle,
  highlights,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  hoverLabels,
}: {
  title: string;
  subtitle: string;
  highlights: HighlightGroup[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  hoverLabels: {
    brand: string;
    category: string;
    color: string;
    designElements: string;
    material: string;
    season: string;
    tags: string;
    price: string;
    empty: string;
    status?: string;
    deleted?: string;
    discarded?: string;
  };
}) {
  return (
    <Card className="space-y-5 p-6">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{subtitle}</div>
      </div>

      <div className="space-y-4">
        {highlights.map((group) => (
          <div
            key={group.label}
            className="rounded-[22px] border border-white/60 bg-[rgba(255,255,255,0.62)] px-4 py-4"
          >
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              {group.label}
            </div>
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                const content = (
                  <div className="rounded-full border border-[rgba(214,154,97,0.24)] bg-[rgba(255,248,242,0.92)] px-3 py-2 text-sm transition hover:border-[rgba(214,154,97,0.4)] hover:bg-white">
                    <div className="group/details relative max-w-full">
                      <div className="truncate text-sm font-medium">
                        <HighlightedText text={item.title} />
                      </div>
                      {item.showSubtitle ? (
                        <div className="mt-0.5 truncate text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          {item.subtitle}
                        </div>
                      ) : null}
                      {item.item ? (
                        <ItemHoverDetails
                          item={item.item}
                          labels={hoverLabels}
                        />
                      ) : null}
                    </div>
                  </div>
                );

                return item.href ? (
                  <Link key={item.id} href={item.href} className="block max-w-full">
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-[0_10px_24px_rgba(77,57,36,0.16)]"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))]"
        >
          {secondaryLabel}
        </Link>
      </div>
    </Card>
  );
}
