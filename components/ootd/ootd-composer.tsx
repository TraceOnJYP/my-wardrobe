"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddToCandidatesButton } from "@/components/ootd/add-to-candidates-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ItemSearchInput } from "@/components/search/item-search-input";
import { FilePickerField } from "@/components/shared/file-picker-field";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { ItemHoverDetails } from "@/components/shared/item-hover-details";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getItemDisplaySubtitle, getItemDisplayTitle } from "@/lib/item-display";
import {
  getIndexedWardrobeItemSearch,
  matchesIndexedSearchEntries,
  matchesSearchValue,
} from "@/lib/search/item-search";
import type { OotdRecord } from "@/types/ootd";
import type { WardrobeItem } from "@/types/item";

const PAGE_SIZE = 20;
const MAX_SELECTED_ITEMS = 20;
const LAST_OPENED_ON_KEY = "smart-wardrobe:ootd-last-opened-on";
const LAST_SELECTED_DAY_KEY = "smart-wardrobe:ootd-last-selected-day";

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function buildItemFingerprint(item: WardrobeItem) {
  return [
    item.name,
    item.brand,
    item.category,
    item.type,
    item.subcategory,
    item.color,
    item.designElements,
    item.material,
    item.sleeveType,
    item.neckline,
    item.fit,
    item.silhouette,
    item.style,
    item.scenario,
    item.size,
    item.price?.toString() ?? "",
    item.priceRange,
    item.purchaseChannel,
    item.purchaseDate,
    item.notes,
    item.imageUrl,
    item.season.join("|"),
    item.tags.join("|"),
  ]
    .map((value) => (typeof value === "string" ? value.trim() : String(value ?? "")))
    .join("::")
    .toLowerCase();
}

export function OotdComposer({
  locale,
  wardrobeItems,
  records,
  initialWearDate,
  recordId,
  initialScenario,
  initialNotes,
  initialImageUrl,
  initialSelectedIds,
  labels,
  showCandidateButton = true,
  selectedIds: controlledSelectedIds,
  onSelectedIdsChange,
  showItemPicker = true,
  recordType = "daily",
  showWearDate = true,
}: {
  locale: string;
  wardrobeItems: WardrobeItem[];
  records: OotdRecord[];
  initialWearDate?: string;
  recordId?: string;
  initialScenario?: string;
  initialNotes?: string;
  initialImageUrl?: string;
  initialSelectedIds?: string[];
  labels: {
    title: string;
    subtitle: string;
    wearDate: string;
    scenario: string;
    notes: string;
    image: string;
    imageHint: string;
    itemPicker: string;
    itemLimit: string;
    saveError: string;
    dailyLimit: string;
    save: string;
    saving: string;
    selected: string;
    noItems: string;
    search: string;
    searchPlaceholder: string;
    recentSearches: string;
    suggestions: string;
    suggestionGroups: Record<SuggestionGroup, string>;
    noSearchResults: string;
    prevPage: string;
    nextPage: string;
    page: string;
    selectedItems: string;
    candidateItems: string;
    addToCandidate: string;
    addedToCandidate: string;
    removeFromCandidate: string;
    detailFields: {
      brand: string;
      category: string;
      color: string;
      designElements: string;
      material: string;
      season: string;
      tags: string;
      price: string;
      empty: string;
    };
  };
  showCandidateButton?: boolean;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  showItemPicker?: boolean;
  recordType?: "daily" | "look";
  showWearDate?: boolean;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [wearDate, setWearDate] = useState(initialWearDate ?? today);
  const [scenario, setScenario] = useState(initialScenario ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(initialSelectedIds ?? []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl ?? null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [submitErrors, setSubmitErrors] = useState<{ scenario: boolean; items: boolean; save: boolean }>({
    scenario: false,
    items: false,
    save: false,
  });
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [year, month, day] = wearDate.split("-").map(Number);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const setSelectedIds = onSelectedIdsChange ?? setInternalSelectedIds;
  const scenarioError = submitErrors.scenario;
  const itemsError = submitErrors.items;

  useEffect(() => {
    setWearDate(initialWearDate ?? today);
  }, [initialWearDate, today]);
  useEffect(() => {
    setScenario(initialScenario ?? "");
  }, [initialScenario]);
  useEffect(() => {
    setNotes(initialNotes ?? "");
  }, [initialNotes]);
  useEffect(() => {
    setImagePreview(initialImageUrl ?? null);
    setImageFile(null);
  }, [initialImageUrl]);
  useEffect(() => {
    if (!controlledSelectedIds) {
      setInternalSelectedIds(initialSelectedIds ?? []);
    }
  }, [controlledSelectedIds, initialSelectedIds]);
  const uniqueWardrobeItems = useMemo(() => {
    const seen = new Set<string>();
    return wardrobeItems.filter((item) => {
      const fingerprint = buildItemFingerprint(item);

      if (seen.has(fingerprint)) {
        return false;
      }

      seen.add(fingerprint);
      return true;
    });
  }, [wardrobeItems]);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getUTCFullYear();
    return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
  }, []);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const dayOptions = useMemo(
    () => Array.from({ length: getDaysInMonth(year, month) }, (_, index) => index + 1),
    [month, year],
  );
  const wardrobeItemMap = useMemo(
    () => new Map(uniqueWardrobeItems.map((item) => [item.id, item])),
    [uniqueWardrobeItems],
  );
  const indexedWardrobeItems = useMemo(
    () => uniqueWardrobeItems.map((item) => getIndexedWardrobeItemSearch(item)),
    [uniqueWardrobeItems],
  );

  const updateWearDate = (next: { year?: number; month?: number; day?: number }) => {
    const nextYear = next.year ?? year;
    const nextMonth = next.month ?? month;
    const nextDay = Math.min(next.day ?? day, getDaysInMonth(nextYear, nextMonth));
    setWearDate(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`,
    );
  };

  const dailyCount = useMemo(
    () => records.filter((record) => record.recordType !== "look" && record.wearDate === wearDate).length,
    [records, wearDate],
  );
  const remaining = Math.max(0, 5 - dailyCount);
  const selectedItems = useMemo(
    () =>
      Array.from(new Set(selectedIds))
        .map((id) => wardrobeItemMap.get(id))
        .filter((item): item is WardrobeItem => Boolean(item)),
    [selectedIds, wardrobeItemMap],
  );
  const filteredItems = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return uniqueWardrobeItems;
    }

    return indexedWardrobeItems
      .filter((entry) => matchesIndexedSearchEntries(entry.entries, query))
      .map((entry) => entry.item);
  }, [deferredSearch, indexedWardrobeItems, uniqueWardrobeItems]);
  const availableItems = useMemo(
    () => filteredItems.filter((item) => !selectedIds.includes(item.id)),
    [filteredItems, selectedIds],
  );
  const suggestionOptions = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const pool = new Map<string, { group: SuggestionGroup; value: string }>();

    for (const item of indexedWardrobeItems) {
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
  }, [deferredSearch, indexedWardrobeItems]);
  const groupedSuggestions = useMemo(() => {
    const groups: Array<{ key: SuggestionGroup; items: string[] }> = [];
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

    for (const key of order) {
      const items = suggestionOptions
        .filter((entry) => entry.group === key)
        .map((entry) => entry.value)
        .slice(0, 4);

      if (items.length > 0) {
        groups.push({ key, items });
      }
    }

    return groups;
  }, [suggestionOptions]);
  const totalPages = Math.max(1, Math.ceil(availableItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return availableItems.slice(start, start + PAGE_SIZE);
  }, [availableItems, currentPage]);

  const toggleItem = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : current.length >= MAX_SELECTED_ITEMS
          ? current
          : Array.from(new Set([...current, itemId])),
    );
    setSubmitErrors((current) => ({ ...current, items: false }));
  };

  const applySuggestion = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onSubmit = () => {
    const nextErrors = {
      scenario: !scenario.trim(),
      items: selectedIds.length === 0,
      save: false,
    };

    if (nextErrors.scenario || nextErrors.items) {
      setSubmitErrors(nextErrors);
      setSaveErrorMessage(null);
      return;
    }

    if (recordType === "daily" && remaining === 0) {
      setSubmitErrors({ scenario: false, items: false, save: true });
      setSaveErrorMessage(labels.itemLimit);
      return;
    }

    startTransition(async () => {
      setSubmitErrors({ scenario: false, items: false, save: false });
      setSaveErrorMessage(null);
      let imageUrl: string | undefined;
      if (!imageFile && initialImageUrl) {
        imageUrl = initialImageUrl;
      }

      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/uploads/wardrobe-image", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadPayload = await uploadResponse.json();
          imageUrl = uploadPayload?.data?.url;
        }
      }

      const response = await fetch(recordId ? `/api/ootd/${recordId}` : "/api/ootd", {
        method: recordId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wearDate,
          recordType,
          scenario: scenario || undefined,
          notes: notes || undefined,
          itemIds: Array.from(new Set(selectedIds)),
          imageUrl,
        }),
      });

      if (!response.ok) {
        let nextMessage = labels.saveError;
        try {
          const payload = await response.json();
          const message = payload?.error?.message;
          if (typeof message === "string" && message.trim()) {
            nextMessage = message.includes("Daily OOTD limit reached") ? labels.itemLimit : labels.saveError;
          }
        } catch {
          nextMessage = labels.saveError;
        }
        setSubmitErrors({ scenario: false, items: false, save: true });
        setSaveErrorMessage(nextMessage);
        return;
      }

      setScenario("");
      setNotes("");
      setSelectedIds([]);
      setImageFile(null);
      setImagePreview(null);
      setSearch("");
      setPage(1);
      if (recordType === "daily") {
        window.localStorage.setItem(LAST_OPENED_ON_KEY, toLocalDateKey(new Date()));
        window.localStorage.setItem(LAST_SELECTED_DAY_KEY, wearDate);
      }
      if (recordType === "look") {
        const payload = await response.json();
        const nextId = recordId ?? payload?.data?.id;
        router.push(nextId ? `/${locale}/looks/${nextId}` : `/${locale}/looks`);
      } else if (recordId) {
        router.push(`/${locale}/ootd/${recordId}?month=${wearDate.slice(0, 7)}`);
      } else {
        router.push(`/${locale}/ootd?month=${wearDate.slice(0, 7)}&day=${wearDate}`);
      }
    });
  };

  return (
    <Card className="space-y-5 p-6">
      <div>
        <div className="text-xl font-semibold">{labels.title}</div>
        <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{labels.subtitle}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {showWearDate ? (
          <label className="space-y-2">
            <div className="text-sm font-medium">{labels.wearDate}</div>
            <SegmentedDatePicker
              locale={locale}
              year={year}
              month={month}
              day={day}
              yearOptions={yearOptions}
              monthOptions={monthOptions}
              dayOptions={dayOptions}
              onChange={updateWearDate}
            />
          </label>
        ) : null}
        <label className="space-y-2">
          <div className={scenarioError ? "text-sm font-medium text-red-700" : "text-sm font-medium"}>
            {labels.scenario} *
          </div>
          <Input
            value={scenario}
            onChange={(event) => {
              setScenario(event.target.value);
              setSubmitErrors((current) => ({ ...current, scenario: false }));
            }}
            placeholder={labels.scenario}
            className={scenarioError ? "border-red-300 bg-[rgba(255,244,244,0.92)] focus:border-red-400" : undefined}
          />
        </label>
      </div>

      <label className="space-y-2">
        <div className="text-sm font-medium">{labels.notes}</div>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={labels.notes} />
      </label>

      <div className="space-y-2">
        <div className="text-sm font-medium">{labels.image}</div>
        <FilePickerField
          accept="image/*"
          buttonLabel={labels.image}
          fileName={imageFile?.name}
          emptyLabel={labels.imageHint}
          helperText={labels.imageHint}
          onChange={(file) => {
            setImageFile(file);
            setImagePreview(file ? URL.createObjectURL(file) : null);
          }}
        />
        {imagePreview ? (
          <img src={imagePreview} alt="OOTD preview" className="h-32 w-24 rounded-[18px] object-cover" />
        ) : null}
      </div>

      {showItemPicker ? (
      <div
        className={
          itemsError
            ? "space-y-3 rounded-[24px] border border-red-300 bg-[rgba(255,244,244,0.72)] p-3"
            : "space-y-3"
        }
      >
        <div className="flex items-center justify-between gap-3">
          <div className={itemsError ? "text-sm font-medium text-red-700" : "text-sm font-medium"}>
            {labels.itemPicker} *
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            {labels.selected} {selectedIds.length} · {labels.dailyLimit} {remaining} / 5
          </div>
        </div>
        {uniqueWardrobeItems.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-foreground))]">{labels.noItems}</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">{labels.search}</div>
              <ItemSearchInput
                value={search}
                onValueChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                onSelect={applySuggestion}
                placeholder={labels.searchPlaceholder}
                emptyLabel={labels.noSearchResults}
                groups={groupedSuggestions.map((group) => ({
                  label: labels.suggestionGroups[group.key],
                  options: group.items,
                }))}
                historyKey="smart-wardrobe:search-history:ootd"
                recentLabel={labels.recentSearches}
              />
            </div>

            {selectedItems.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">{labels.selectedItems}</div>
                <div className="grid gap-2">
                  {selectedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className="flex items-center gap-3 rounded-[20px] border border-[hsl(var(--primary))] bg-[rgba(255,247,238,0.95)] p-3 text-left shadow-[0_10px_22px_rgba(77,57,36,0.06)]"
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-14 w-12 rounded-[14px] object-cover" />
                      ) : (
                        <div className="h-14 w-12 rounded-[14px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          <HighlightedText text={getItemDisplayTitle(item, "", "")} query={search} />
                        </div>
                        <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                          <HighlightedText text={getItemDisplaySubtitle(item) || ""} query={search} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-sm font-medium">{labels.candidateItems}</div>
              {pagedItems.length === 0 ? (
                <div className="rounded-[20px] border border-white/70 bg-white/72 p-4 text-sm text-[hsl(var(--muted-foreground))]">
                  {labels.noSearchResults}
                </div>
              ) : (
                <div className="grid gap-2">
                  {pagedItems.map((item) => {
                    const active = selectedIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={
                          active
                            ? "flex items-center gap-3 rounded-[20px] border border-[hsl(var(--primary))] bg-[rgba(255,247,238,0.95)] p-3 text-left shadow-[0_10px_22px_rgba(77,57,36,0.06)]"
                            : "flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/80 p-3 text-left"
                        }
                      >
                        <button type="button" onClick={() => toggleItem(item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-14 w-12 rounded-[14px] object-cover" />
                          ) : (
                            <div className="h-14 w-12 rounded-[14px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              <HighlightedText text={getItemDisplayTitle(item, "", "")} query={search} />
                            </div>
                            <div className="group/details relative inline-block max-w-full">
                              <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                                <HighlightedText text={getItemDisplaySubtitle(item) || ""} query={search} />
                              </div>
                              <ItemHoverDetails item={item} labels={labels.detailFields} />
                            </div>
                          </div>
                        </button>
                        {showCandidateButton ? (
                          <AddToCandidatesButton
                            item={item}
                            labels={{
                              add: labels.addToCandidate,
                              added: labels.addedToCandidate,
                              remove: labels.removeFromCandidate,
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
              >
                {labels.prevPage}
              </Button>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                {labels.page} {currentPage} / {totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
              >
                {labels.nextPage}
              </Button>
            </div>
          </div>
        )}
      </div>
      ) : (
        <div className="hidden" />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {recordType === "daily" ? `${labels.dailyLimit} ${remaining} / 5 · ${labels.itemLimit}` : labels.itemLimit}
        </div>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isPending || (recordType === "daily" && remaining === 0)}
        >
          {isPending ? labels.saving : labels.save}
        </Button>
      </div>
      {submitErrors.scenario || submitErrors.items || submitErrors.save ? (
        <div className="space-y-1 text-sm text-red-700">
          {submitErrors.scenario ? <div>请填写{labels.scenario}</div> : null}
          {submitErrors.items ? <div>请至少选择 1 个单品</div> : null}
          {submitErrors.save ? <div>{saveErrorMessage ?? labels.saveError}</div> : null}
        </div>
      ) : null}
    </Card>
  );
}

function SegmentedDatePicker({
  locale,
  year,
  month,
  day,
  yearOptions,
  monthOptions,
  dayOptions,
  onChange,
}: {
  locale: string;
  year: number;
  month: number;
  day: number;
  yearOptions: number[];
  monthOptions: number[];
  dayOptions: number[];
  onChange: (next: { year?: number; month?: number; day?: number }) => void;
}) {
  const [openPart, setOpenPart] = useState<"year" | "month" | "day" | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenPart(null);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex w-full items-center rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3 text-sm">
        <DateSegment
          label={locale === "zh-CN" ? `${year}年` : String(year)}
          active={openPart === "year"}
          onClick={() => setOpenPart((current) => (current === "year" ? null : "year"))}
        />
        <span className="px-1 text-[hsl(var(--muted-foreground))]">/</span>
        <DateSegment
          label={locale === "zh-CN" ? `${month}月` : String(month)}
          active={openPart === "month"}
          onClick={() => setOpenPart((current) => (current === "month" ? null : "month"))}
        />
        <span className="px-1 text-[hsl(var(--muted-foreground))]">/</span>
        <DateSegment
          label={locale === "zh-CN" ? `${day}日` : String(day)}
          active={openPart === "day"}
          onClick={() => setOpenPart((current) => (current === "day" ? null : "day"))}
        />
      </div>

      {openPart ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-[70] rounded-[22px] border border-white/75 bg-white/95 p-2 shadow-[0_16px_35px_rgba(77,57,36,0.12)] backdrop-blur-xl">
          <div className="grid max-h-60 grid-cols-3 gap-2 overflow-auto pr-1">
            {(openPart === "year" ? yearOptions : openPart === "month" ? monthOptions : dayOptions).map((option) => (
              <button
                key={`${openPart}-${option}`}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange({ [openPart]: option });
                  setOpenPart(null);
                }}
                className="rounded-[16px] px-3 py-2 text-sm transition hover:bg-[rgba(255,244,235,0.95)]"
              >
                {locale === "zh-CN"
                  ? openPart === "year"
                    ? `${option}年`
                    : openPart === "month"
                      ? `${option}月`
                      : `${option}日`
                  : option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DateSegment({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-1.5 py-0.5 transition",
        active ? "bg-[rgba(255,244,235,0.95)] text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
