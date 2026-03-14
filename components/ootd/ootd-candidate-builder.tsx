"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AddToCandidatesButton } from "@/components/ootd/add-to-candidates-button";
import { OotdComposer } from "@/components/ootd/ootd-composer";
import { ItemSearchInput } from "@/components/search/item-search-input";
import { ItemHoverDetails } from "@/components/shared/item-hover-details";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getItemDisplaySubtitle, getItemDisplayTitle } from "@/lib/item-display";
import { addOotdCandidate, clearOotdCandidates, getOotdCandidates, onOotdCandidatesChanged } from "@/lib/ootd-candidates";
import { getWardrobeItemSearchEntries, matchesSearchEntries, matchesSearchText } from "@/lib/search/item-search";
import type { OotdRecord } from "@/types/ootd";
import type { WardrobeItem } from "@/types/item";

const SEARCH_PAGE_SIZE = 5;
const MAX_SELECTED_ITEMS = 20;

type SuggestionGroup =
  | "name"
  | "brand"
  | "category"
  | "color"
  | "designElements"
  | "material"
  | "style"
  | "scenario"
  | "season"
  | "tags";

function buildSuggestionEntries(item: WardrobeItem) {
  const entries: Array<{ group: SuggestionGroup; value: string }> = [];

  if (item.name?.trim()) entries.push({ group: "name", value: item.name.trim() });
  if (item.brand?.trim()) entries.push({ group: "brand", value: item.brand.trim() });
  if (item.category?.trim()) entries.push({ group: "category", value: item.category.trim() });
  if (item.subcategory?.trim()) entries.push({ group: "category", value: item.subcategory.trim() });
  if (item.color?.trim()) entries.push({ group: "color", value: item.color.trim() });
  if (item.designElements?.trim()) entries.push({ group: "designElements", value: item.designElements.trim() });
  if (item.material?.trim()) entries.push({ group: "material", value: item.material.trim() });
  if (item.style?.trim()) entries.push({ group: "style", value: item.style.trim() });
  if (item.scenario?.trim()) entries.push({ group: "scenario", value: item.scenario.trim() });

  for (const season of item.season) {
    if (season?.trim()) entries.push({ group: "season", value: season.trim() });
  }

  for (const tag of item.tags) {
    if (tag?.trim()) entries.push({ group: "tags", value: tag.trim() });
  }

  return entries;
}

export function OotdCandidateBuilder({
  locale,
  records,
  wardrobeItems,
  initialWearDate,
  recordId,
  initialScenario,
  initialNotes,
  initialImageUrl,
  initialSelectedIds,
  initialPoolItems,
  labels,
  recordType = "daily",
  showWearDate = true,
}: {
  locale: string;
  records: OotdRecord[];
  wardrobeItems: WardrobeItem[];
  initialWearDate?: string;
  recordId?: string;
  initialScenario?: string;
  initialNotes?: string;
  initialImageUrl?: string;
  initialSelectedIds?: string[];
  initialPoolItems?: WardrobeItem[];
  labels: {
    title: string;
    subtitle: string;
    empty: string;
    back: string;
    clear: string;
    countPrefix: string;
    remove: string;
    composer: Parameters<typeof OotdComposer>[0]["labels"];
  };
  recordType?: "daily" | "look";
  showWearDate?: boolean;
}) {
  const [items, setItems] = useState<WardrobeItem[]>(() => {
    const seen = new Set<string>();
    return (initialPoolItems ?? []).filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds ?? []);
  const [search, setSearch] = useState("");
  const [candidatePage, setCandidatePage] = useState(1);
  const candidateStripRef = useRef<HTMLDivElement | null>(null);
  const candidateItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pendingScrollItemId, setPendingScrollItemId] = useState<string | null>(null);

  useEffect(() => {
    const mergeItems = () => {
      const merged = [...(initialPoolItems ?? []), ...getOotdCandidates()];
      const seen = new Set<string>();
      return merged.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    };

    setItems(mergeItems());
    return onOotdCandidatesChanged((detail) => {
      if (detail?.changedItemId) {
        setPendingScrollItemId(detail.changedItemId);
      }
      setItems(mergeItems());
    });
  }, [initialPoolItems]);

  useEffect(() => {
    setSelectedIds(initialSelectedIds ?? []);
  }, [initialSelectedIds]);

  useEffect(() => {
    if (items.length === 0) return;
    setSelectedIds((current) => current.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  useEffect(() => {
    setCandidatePage(1);
  }, [search, selectedIds]);

  useEffect(() => {
    if (!pendingScrollItemId) return;

    requestAnimationFrame(() => {
      const target = candidateItemRefs.current[pendingScrollItemId];
      target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      setPendingScrollItemId(null);
    });
  }, [items, pendingScrollItemId]);

  const clearItems = () => {
    clearOotdCandidates();
    setItems([]);
  };

  const searchableItems = useMemo(() => {
    const merged = [...wardrobeItems, ...items];
    const seen = new Set<string>();

    return merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [items, wardrobeItems]);

  const filteredCandidateItems = useMemo(() => {
    const baseItems = searchableItems.filter((item) => !selectedIds.includes(item.id));
    const query = search.trim().toLowerCase();

    if (!query) {
      return baseItems;
    }

    return baseItems.filter((item) => matchesSearchEntries(getWardrobeItemSearchEntries(item), query));
  }, [search, searchableItems, selectedIds]);
  const suggestionOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool = new Map<string, { group: SuggestionGroup; value: string }>();

    for (const item of searchableItems) {
      if (selectedIds.includes(item.id)) continue;

      for (const entry of buildSuggestionEntries(item)) {
        if (!query || matchesSearchText([entry.value], query)) {
          pool.set(`${entry.group}:${entry.value}`, entry);
        }

        if (pool.size >= 16) {
          return Array.from(pool.values());
        }
      }
    }

    return Array.from(pool.values());
  }, [search, searchableItems, selectedIds]);
  const groupedSuggestions = useMemo(() => {
    const order: SuggestionGroup[] = [
      "name",
      "brand",
      "category",
      "color",
      "designElements",
      "material",
      "style",
      "scenario",
      "season",
      "tags",
    ];

    return order
      .map((key) => ({
        key,
        items: suggestionOptions
          .filter((entry) => entry.group === key)
          .map((entry) => entry.value)
          .slice(0, 4),
      }))
      .filter((group) => group.items.length > 0);
  }, [suggestionOptions]);
  const candidateTotalPages = Math.max(1, Math.ceil(filteredCandidateItems.length / SEARCH_PAGE_SIZE));
  const currentCandidatePage = Math.min(candidatePage, candidateTotalPages);
  const pagedCandidateItems = useMemo(() => {
    const start = (currentCandidatePage - 1) * SEARCH_PAGE_SIZE;
    return filteredCandidateItems.slice(start, start + SEARCH_PAGE_SIZE);
  }, [currentCandidatePage, filteredCandidateItems]);

  const candidateItems = useMemo(
    () => filteredCandidateItems,
    [filteredCandidateItems],
  );

  const toggleItemSelection = (itemId: string) => {
    setPendingScrollItemId(itemId);
    setSelectedIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }

      if (current.length >= MAX_SELECTED_ITEMS) {
        return current;
      }

      return [...current, itemId];
    });
  };

  const selectFromSearchResult = (item: WardrobeItem) => {
    addOotdCandidate(item);
    setPendingScrollItemId(item.id);
    setSelectedIds((current) => {
      if (current.includes(item.id) || current.length >= MAX_SELECTED_ITEMS) {
        return current;
      }

      return [...current, item.id];
    });
  };

  const applySuggestion = (value: string) => {
    setSearch(value);
    setCandidatePage(1);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
      <Card className="space-y-4 p-6">
        <div>
          <div className="text-xl font-semibold">{labels.title}</div>
          <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{labels.subtitle}</div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/70 bg-white/70 px-4 py-3">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            {labels.countPrefix} {items.length}
          </div>
          <Button
            type="button"
            onClick={clearItems}
            disabled={items.length === 0}
            className="bg-[rgba(255,244,235,0.96)] text-[hsl(var(--foreground))]"
          >
            {labels.clear}
          </Button>
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[22px] border border-white/70 bg-white/72 p-4 text-sm text-[hsl(var(--muted-foreground))]">
              {labels.empty}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{labels.composer.candidateItems}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {labels.composer.selected} {selectedIds.length} / {MAX_SELECTED_ITEMS}
                </div>
              </div>
              <div ref={candidateStripRef} className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      ref={(node) => {
                        candidateItemRefs.current[item.id] = node;
                      }}
                      type="button"
                      onClick={() => toggleItemSelection(item.id)}
                      className={
                        isSelected
                          ? "w-[132px] shrink-0 snap-start rounded-[20px] border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] p-3 text-left text-[hsl(var(--primary-foreground))] shadow-[0_12px_24px_rgba(77,57,36,0.18)] transition"
                          : "w-[132px] shrink-0 snap-start rounded-[20px] border border-white/70 bg-white/82 p-3 text-left shadow-[0_8px_18px_rgba(77,57,36,0.06)] transition hover:border-[rgba(214,154,97,0.4)]"
                      }
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-20 w-full rounded-[16px] object-cover"
                        />
                      ) : (
                        <div className="h-20 w-full rounded-[16px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
                      )}
                      <div className="group/details relative mt-2 inline-block max-w-full">
                        <div
                          className={
                            isSelected
                              ? "truncate text-sm font-semibold text-[hsl(var(--primary-foreground))]"
                              : "truncate text-sm font-semibold text-[hsl(var(--foreground))]"
                          }
                        >
                          {getItemDisplayTitle(item, "", "")}
                        </div>
                        <ItemHoverDetails item={item} labels={labels.composer.detailFields} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium">{labels.composer.searchLabel}</div>
            <div className="space-y-2">
              <ItemSearchInput
                value={search}
                onValueChange={(value) => {
                  setSearch(value);
                  setCandidatePage(1);
                }}
                onSelect={applySuggestion}
                placeholder={labels.composer.searchPlaceholder}
                emptyLabel={labels.composer.noSearchResults}
                groups={groupedSuggestions.map((group) => ({
                  label: labels.composer.suggestionGroups[group.key],
                  options: group.items,
                }))}
                historyKey="smart-wardrobe:search-history:ootd-candidates"
                recentLabel={labels.composer.recentSearches}
              />
              {candidateItems.length === 0 ? (
                <div className="rounded-[20px] border border-white/70 bg-white/72 p-4 text-sm text-[hsl(var(--muted-foreground))]">
                  {labels.composer.noSearchResults}
                </div>
              ) : (
                <div className="grid gap-2">
                  {pagedCandidateItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/80 p-3"
                    >
                      <button
                        type="button"
                        onClick={() => selectFromSearchResult(item)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-14 w-12 rounded-[14px] object-cover" />
                        ) : (
                          <div className="h-14 w-12 rounded-[14px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{getItemDisplayTitle(item, "", "")}</div>
                          <div className="group/details relative inline-block max-w-full">
                            <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                              {getItemDisplaySubtitle(item) || ""}
                            </div>
                            <ItemHoverDetails item={item} labels={labels.composer.detailFields} />
                          </div>
                        </div>
                      </button>
                      <AddToCandidatesButton
                        item={item}
                        labels={{
                          add: labels.composer.addToCandidate,
                          added: labels.composer.addedToCandidate,
                          remove: labels.composer.removeFromCandidate,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCandidatePage((current) => Math.max(1, current - 1))}
                  disabled={currentCandidatePage <= 1}
                >
                  {labels.composer.prevPage}
                </Button>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {labels.composer.page} {currentCandidatePage} / {candidateTotalPages}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCandidatePage((current) => Math.min(candidateTotalPages, current + 1))}
                  disabled={currentCandidatePage >= candidateTotalPages}
                >
                  {labels.composer.nextPage}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <OotdComposer
        locale={locale}
        wardrobeItems={items}
        records={records}
        initialWearDate={initialWearDate}
        recordId={recordId}
        initialScenario={initialScenario}
        initialNotes={initialNotes}
        initialImageUrl={initialImageUrl}
        initialSelectedIds={initialSelectedIds}
        labels={labels.composer}
        showCandidateButton={false}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        showItemPicker={false}
        recordType={recordType}
        showWearDate={showWearDate}
      />
    </div>
  );
}
