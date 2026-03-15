"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { OotdComposer } from "@/components/ootd/ootd-composer";
import { ItemSearchInput } from "@/components/search/item-search-input";
import { ItemHoverDetails } from "@/components/shared/item-hover-details";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getItemDisplaySubtitle, getItemDisplayTitle } from "@/lib/item-display";
import {
  addOotdCandidate,
  clearOotdCandidates,
  getOotdCandidates,
  onOotdCandidatesChanged,
  removeOotdCandidate,
} from "@/lib/ootd-candidates";
import {
  getIndexedWardrobeItemSearch,
  matchesIndexedSearchEntries,
  matchesSearchValue,
} from "@/lib/search/item-search";
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
  const deferredSearch = useDeferredValue(search);
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
    const seen = new Set<string>();

    return wardrobeItems.filter((item) => {
      if (item.deletedAt || item.discardedAt) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [wardrobeItems]);
  const indexedSearchableItems = useMemo(
    () => searchableItems.map((item) => getIndexedWardrobeItemSearch(item)),
    [searchableItems],
  );

  const filteredCandidateItems = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return indexedSearchableItems.map((entry) => entry.item);
    }

    return indexedSearchableItems
      .filter((entry) => matchesIndexedSearchEntries(entry.entries, query))
      .map((entry) => entry.item);
  }, [deferredSearch, indexedSearchableItems]);
  const suggestionOptions = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const pool = new Map<string, { group: SuggestionGroup; value: string }>();

    for (const item of indexedSearchableItems) {
      for (const entry of item.suggestions) {
        if (!query || matchesSearchValue(entry.value, query)) {
          pool.set(`${entry.group}:${entry.value}`, entry);
        }

        if (pool.size >= 16) {
          return Array.from(pool.values());
        }
      }
    }

    return Array.from(pool.values());
  }, [deferredSearch, indexedSearchableItems, selectedIds]);
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

  const removeFromPool = (itemId: string) => {
    removeOotdCandidate(itemId);
    setSelectedIds((current) => current.filter((id) => id !== itemId));
    setPendingScrollItemId(null);
  };

  const selectFromSearchResult = (item: WardrobeItem) => {
    const existsInPool = items.some((entry) => entry.id === item.id);
    if (!existsInPool) {
      addOotdCandidate(item);
      setPendingScrollItemId(item.id);
    } else {
      setPendingScrollItemId(item.id);
    }

    setSelectedIds((current) => {
      if (current.includes(item.id)) {
        return current.filter((id) => id !== item.id);
      }
      if (current.length >= MAX_SELECTED_ITEMS) {
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
                    <div
                      key={item.id}
                      ref={(node) => {
                        candidateItemRefs.current[item.id] = node;
                      }}
                      className={
                        isSelected
                          ? "relative w-[132px] shrink-0 snap-start rounded-[20px] border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] p-3 text-left text-[hsl(var(--primary-foreground))] shadow-[0_12px_24px_rgba(77,57,36,0.18)] transition"
                          : "relative w-[132px] shrink-0 snap-start rounded-[20px] border border-white/70 bg-white/82 p-3 text-left shadow-[0_8px_18px_rgba(77,57,36,0.06)] transition hover:border-[rgba(214,154,97,0.4)]"
                      }
                    >
                      <button type="button" onClick={() => toggleItemSelection(item.id)} className="block w-full text-left">
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
                          {item.deletedAt || item.discardedAt ? (
                            <div
                              className={
                                isSelected
                                  ? "mt-1 text-[11px] text-[rgba(255,245,234,0.86)]"
                                  : "mt-1 text-[11px] text-[hsl(var(--muted-foreground))]"
                              }
                            >
                              {item.deletedAt ? (locale === "zh-CN" ? "单品已删除" : "Item deleted") : locale === "zh-CN" ? "单品已丢弃" : "Item discarded"}
                            </div>
                          ) : null}
                          <ItemHoverDetails item={item} labels={labels.composer.detailFields} />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFromPool(item.id);
                        }}
                        className={
                          isSelected
                            ? "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-base font-semibold text-[hsl(var(--primary))] shadow-[0_6px_14px_rgba(77,57,36,0.16)] transition hover:bg-[rgba(255,232,214,0.98)]"
                            : "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,248,241,0.98)] text-base font-semibold text-[hsl(var(--foreground))] shadow-[0_6px_14px_rgba(77,57,36,0.1)] transition hover:bg-[rgba(239,219,201,0.98)]"
                        }
                        aria-label={labels.remove}
                      >
                        -
                      </button>
                    </div>
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
                      className={
                        selectedIds.includes(item.id)
                          ? "flex items-center gap-3 rounded-[20px] border border-[hsl(var(--primary))] bg-[rgba(255,247,238,0.96)] p-3 shadow-[0_10px_22px_rgba(77,57,36,0.1)]"
                          : "flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/80 p-3"
                      }
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
                          <div
                            className={
                              selectedIds.includes(item.id)
                                ? "truncate font-medium text-[hsl(var(--foreground))]"
                                : "truncate font-medium"
                            }
                          >
                            {getItemDisplayTitle(item, "", "")}
                          </div>
                          <div className="group/details relative inline-block max-w-full">
                            <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                              {getItemDisplaySubtitle(item) || ""}
                            </div>
                            <ItemHoverDetails item={item} labels={labels.composer.detailFields} />
                          </div>
                        </div>
                      </button>
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
