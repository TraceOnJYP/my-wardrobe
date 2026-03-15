"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { WardrobeItem } from "@/types/item";
import { Button } from "@/components/ui/button";
import { WardrobeItemCard } from "@/components/wardrobe/wardrobe-item-card";

export function WardrobeGrid({
  items,
  labels,
  locale,
  query,
  currentPage,
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
    page: string;
    prevPage: string;
    nextPage: string;
  };
  locale: string;
  query?: string;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const pagedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage],
  );

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      next.delete("gridPage");
    } else {
      next.set("gridPage", String(nextPage));
    }

    router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pagedItems.map((item) => (
          <WardrobeItemCard
            key={item.id}
            item={item}
            labels={labels}
            href={`/${locale}/wardrobe/${item.id}`}
            query={query}
          />
        ))}
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-[24px] border border-white/60 bg-white/55 px-4 py-3 text-sm backdrop-blur-xl">
          <Button type="button" variant="outline" onClick={() => updatePage(safePage - 1)} disabled={safePage <= 1}>
            {labels.prevPage}
          </Button>
          <div className="text-[hsl(var(--muted-foreground))]">
            {labels.page} {safePage} / {totalPages}
          </div>
          <Button type="button" variant="outline" onClick={() => updatePage(safePage + 1)} disabled={safePage >= totalPages}>
            {labels.nextPage}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
