"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AddToCandidatesButton } from "@/components/ootd/add-to-candidates-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { ItemHoverDetails } from "@/components/shared/item-hover-details";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getItemDisplayCategory, getItemDisplaySubtitle, getItemDisplayTitle } from "@/lib/item-display";
import type { WardrobeItem } from "@/types/item";

type SortField =
  | "name"
  | "itemType"
  | "category"
  | "subcategory"
  | "brand"
  | "color"
  | "designElements"
  | "material"
  | "sleeveType"
  | "collarType"
  | "fit"
  | "silhouette"
  | "style"
  | "season"
  | "scenario"
  | "price"
  | "priceRange"
  | "wearDays"
  | "costPerWear"
  | "favoriteScore"
  | "purchaseChannel"
  | "purchaseDate"
  | "updatedAt";

type ColumnId = Exclude<SortField, "name">;

const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = [
  "designElements",
  "itemType",
  "category",
  "brand",
  "color",
  "season",
  "price",
  "wearDays",
  "costPerWear",
];
const STORAGE_KEY = "smart-wardrobe:list-visible-columns";

function migrateVisibleColumns(columns: ColumnId[]) {
  const uniqueColumns = Array.from(new Set(columns)).filter((column) => column !== "subcategory");
  const withoutDesignElements = uniqueColumns.filter((column) => column !== "designElements");
  return ["designElements", ...withoutDesignElements] as ColumnId[];
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value?: number) {
  return value === undefined ? "-" : value.toFixed(0);
}

function itemTint(item: WardrobeItem) {
  const source = `${item.category}-${item.color ?? ""}-${item.brand ?? ""}`.toLowerCase();
  if (source.includes("black") || source.includes("黑")) return "from-stone-300 via-stone-200 to-white";
  if (source.includes("white") || source.includes("白")) return "from-zinc-100 via-white to-stone-100";
  if (source.includes("blue") || source.includes("蓝")) return "from-sky-200 via-cyan-100 to-white";
  if (source.includes("brown") || source.includes("棕") || source.includes("咖")) return "from-amber-200 via-orange-100 to-white";
  if (source.includes("red") || source.includes("红")) return "from-rose-200 via-orange-100 to-white";
  return "from-[#eadcc9] via-[#f5efe6] to-white";
}

function orderLabel(locale: string, order: "asc" | "desc") {
  if (locale === "zh-CN") {
    return order === "asc" ? "升序" : "降序";
  }

  return order === "asc" ? "ASC" : "DESC";
}

function normalizeSortParams(sort: string, order: string) {
  const sortFields = sort
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean) as SortField[];
  const sortOrders = order
    .split(",")
    .map((value) => (value.trim() === "asc" ? "asc" : "desc")) as Array<"asc" | "desc">;

  return {
    sortFields,
    sortOrders: sortFields.map((_, index) => sortOrders[index] ?? "desc"),
  };
}

function getSortValue(item: WardrobeItem, field: SortField) {
  switch (field) {
    case "name":
      return item.name;
    case "itemType":
      return item.itemType ?? "other";
    case "category":
      return item.category;
    case "subcategory":
      return item.subcategory ?? "";
    case "brand":
      return item.brand ?? "";
    case "color":
      return item.color ?? "";
    case "designElements":
      return item.designElements ?? "";
    case "material":
      return item.material ?? "";
    case "sleeveType":
      return item.sleeveType ?? "";
    case "collarType":
      return item.collarType ?? "";
    case "fit":
      return item.fit ?? "";
    case "silhouette":
      return item.silhouette ?? "";
    case "style":
      return item.style ?? "";
    case "season":
      return item.season.join(" / ");
    case "scenario":
      return item.scenario ?? "";
    case "price":
      return item.price ?? 0;
    case "priceRange":
      return item.priceRange ?? "";
    case "wearDays":
      return item.wearDays ?? 0;
    case "costPerWear":
      return item.wearDays === 0 ? item.price ?? 0 : item.costPerWear ?? 0;
    case "favoriteScore":
      return item.favoriteScore ?? 0;
    case "purchaseChannel":
      return item.purchaseChannel ?? "";
    case "purchaseDate":
      return item.purchaseDate ? new Date(item.purchaseDate).getTime() : 0;
    case "updatedAt":
      return new Date(item.updatedAt).getTime();
  }
}

export function WardrobeList({
  items,
  labels,
  locale,
  sort,
  order,
  query,
}: {
  items: WardrobeItem[];
  labels: {
    unknownBrand: string;
    wears: string;
    item: string;
    itemType: string;
    category: string;
    brand: string;
    color: string;
    updatedAt: string;
    selected: string;
    selectionIdle: string;
    enterSelection: string;
    selectHint: string;
    clearSelection: string;
    deleteSelected: string;
    deleting: string;
    deleteSelectedTitle: string;
    deleteSelectedConfirm: string;
    cancel: string;
    selectAll: string;
    selectRow: string;
    subcategory: string;
    material: string;
    designElements: string;
    sleeveType: string;
    collarType: string;
    fit: string;
    silhouette: string;
    style: string;
    season: string;
    scenario: string;
    price: string;
    priceRange: string;
    costPerWear: string;
    favoriteScore: string;
    purchaseChannel: string;
    purchaseDate: string;
    columnPicker: string;
    closeColumns: string;
    sortSummary: string;
    clearSort: string;
    defaultSort: string;
    pageSize: string;
    page: string;
    prevPage: string;
    nextPage: string;
    typeClothing: string;
    typeAccessory: string;
    typeBag: string;
    typeShoes: string;
    typeJewelry: string;
    typeOther: string;
    tags: string;
    addToCandidate: string;
    addedToCandidate: string;
    removeFromCandidate: string;
    emptyDetails: string;
  };
  locale: string;
  sort: string;
  order: string;
  query?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE_COLUMNS);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const { sortFields, sortOrders } = useMemo(() => normalizeSortParams(sort, order), [sort, order]);
  const allSelected = isSelectionMode && items.length > 0 && selectedIds.length === items.length;

  const columnOptions: Array<{ id: ColumnId; label: string }> = [
    { id: "itemType", label: labels.itemType },
    { id: "category", label: labels.category },
    { id: "brand", label: labels.brand },
    { id: "color", label: labels.color },
    { id: "designElements", label: labels.designElements },
    { id: "material", label: labels.material },
    { id: "sleeveType", label: labels.sleeveType },
    { id: "collarType", label: labels.collarType },
    { id: "fit", label: labels.fit },
    { id: "silhouette", label: labels.silhouette },
    { id: "style", label: labels.style },
    { id: "season", label: labels.season },
    { id: "scenario", label: labels.scenario },
    { id: "price", label: labels.price },
    { id: "priceRange", label: labels.priceRange },
    { id: "wearDays", label: labels.wears },
    { id: "costPerWear", label: labels.costPerWear },
    { id: "favoriteScore", label: labels.favoriteScore },
    { id: "purchaseChannel", label: labels.purchaseChannel },
    { id: "purchaseDate", label: labels.purchaseDate },
    { id: "updatedAt", label: labels.updatedAt },
  ];

  const activeColumns = columnOptions.filter((column) => visibleColumns.includes(column.id));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const next = migrateVisibleColumns(
        columnOptions.map((column) => column.id).filter((id) => parsed.includes(id)),
      );
      if (next.length > 0) {
        setVisibleColumns(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch {
      return;
    }
  }, [visibleColumns]);

  const sortedItems = useMemo(() => {
    if (sortFields.length === 0) {
      return items;
    }

    return [...items].sort((left, right) => {
      for (let index = 0; index < sortFields.length; index += 1) {
        const field = sortFields[index];
        const direction = sortOrders[index] === "asc" ? 1 : -1;
        const leftValue = getSortValue(left, field);
        const rightValue = getSortValue(right, field);

        if (typeof leftValue === "number" && typeof rightValue === "number") {
          if (leftValue !== rightValue) {
            return (leftValue - rightValue) * direction;
          }
          continue;
        }

        const comparison = String(leftValue).localeCompare(String(rightValue), locale);
        if (comparison !== 0) {
          return comparison * direction;
        }
      }

      return 0;
    });
  }, [items, locale, sortFields, sortOrders]);
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const pagedItems = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedItems, totalPages]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sort, order, items.length]);

  const buildSortHref = (field: SortField) => {
    const next = new URLSearchParams(searchParams.toString());
    const existingIndex = sortFields.indexOf(field);
    const nextSortFields = [...sortFields];
    const nextSortOrders = [...sortOrders];

    if (existingIndex === -1) {
      nextSortFields.unshift(field);
      nextSortOrders.unshift("asc");
    } else {
      const currentOrder = nextSortOrders[existingIndex];

      if (currentOrder === "asc") {
        nextSortFields.splice(existingIndex, 1);
        nextSortOrders.splice(existingIndex, 1);
        nextSortFields.unshift(field);
        nextSortOrders.unshift("desc");
      } else {
        nextSortFields.splice(existingIndex, 1);
        nextSortOrders.splice(existingIndex, 1);
      }
    }

    if (nextSortFields.length === 0) {
      next.delete("sort");
      next.delete("order");
    } else {
      next.set("sort", nextSortFields.join(","));
      next.set("order", nextSortOrders.join(","));
    }
    return `${pathname}?${next.toString()}`;
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? sortedItems.map((item) => item.id) : []);
  };

  const toggleOne = (itemId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, itemId])] : current.filter((id) => id !== itemId),
    );
  };

  const toggleColumn = (columnId: ColumnId) => {
    setVisibleColumns((current) => {
      if (current.includes(columnId)) {
        const next = current.filter((id) => id !== columnId);
        return next.length > 0 ? next : current;
      }

      return columnOptions
        .map((column) => column.id)
        .filter((id) => id === columnId || current.includes(id));
    });
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;

    startTransition(async () => {
      const response = await fetch("/api/items/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemIds: selectedIds }),
      });

      if (!response.ok) {
        return;
      }

      setSelectedIds([]);
      setIsSelectionMode(false);
      setDeleteDialogOpen(false);
      router.refresh();
    });
  };

  const renderCell = (item: WardrobeItem, columnId: ColumnId) => {
    switch (columnId) {
      case "itemType":
        return item.itemType === "clothing"
          ? labels.typeClothing
          : item.itemType === "accessory"
            ? labels.typeAccessory
            : item.itemType === "bag"
              ? labels.typeBag
              : item.itemType === "shoes"
                ? labels.typeShoes
                : item.itemType === "jewelry"
                  ? labels.typeJewelry
                  : labels.typeOther;
      case "category":
        return getItemDisplayCategory(item);
      case "subcategory":
        return getItemDisplayCategory(item);
      case "brand":
        return item.brand ?? labels.unknownBrand;
      case "color":
        return item.color ?? "-";
      case "designElements":
        return item.designElements ?? "-";
      case "material":
        return item.material ?? "-";
      case "sleeveType":
        return item.sleeveType ?? "-";
      case "collarType":
        return item.collarType ?? "-";
      case "fit":
        return item.fit ?? "-";
      case "silhouette":
        return item.silhouette ?? "-";
      case "style":
        return item.style ?? "-";
      case "season":
        return item.season.length > 0 ? item.season.join(" / ") : "-";
      case "scenario":
        return item.scenario ?? "-";
      case "price":
        return formatCurrency(item.price);
      case "priceRange":
        return item.priceRange ?? "-";
      case "wearDays":
        return item.wearDays;
      case "costPerWear":
        return formatCurrency(item.wearDays === 0 ? item.price : item.costPerWear);
      case "favoriteScore":
        return item.favoriteScore ?? "-";
      case "purchaseChannel":
        return item.purchaseChannel ?? "-";
      case "purchaseDate":
        return item.purchaseDate ? formatDate(item.purchaseDate, locale) : "-";
      case "updatedAt":
        return formatDate(item.updatedAt, locale);
    }
  };

  const sortBadge = (field: SortField) => {
    const index = sortFields.indexOf(field);
    if (index === -1) return null;
    return `${sortOrders[index] === "asc" ? "↑" : "↓"}${sortFields.length > 1 ? index + 1 : ""}`;
  };
  const labelByField: Record<SortField, string> = {
    name: labels.item,
    itemType: labels.itemType,
    category: labels.category,
    subcategory: labels.category,
    brand: labels.brand,
    color: labels.color,
    designElements: labels.designElements,
    material: labels.material,
    sleeveType: labels.sleeveType,
    collarType: labels.collarType,
    fit: labels.fit,
    silhouette: labels.silhouette,
    style: labels.style,
    season: labels.season,
    scenario: labels.scenario,
    price: labels.price,
    priceRange: labels.priceRange,
    wearDays: labels.wears,
    costPerWear: labels.costPerWear,
    favoriteScore: labels.favoriteScore,
    purchaseChannel: labels.purchaseChannel,
    purchaseDate: labels.purchaseDate,
    updatedAt: labels.updatedAt,
  };
  const sortSummaryText = sortFields
    .map((field, index) => `${labelByField[field]} ${orderLabel(locale, sortOrders[index])}${sortFields.length > 1 ? ` ${index + 1}` : ""}`)
    .join(" · ");

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(217,204,191,0.65)] bg-[rgba(255,248,241,0.85)] px-5 py-3">
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          {isSelectionMode
            ? selectedIds.length > 0
              ? `${labels.selected} ${selectedIds.length}`
              : labels.selectHint
            : labels.selectionIdle}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button type="button" variant="outline" onClick={() => setIsColumnPickerOpen((current) => !current)}>
              {labels.columnPicker}
            </Button>
            {isColumnPickerOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-72 rounded-[22px] border border-white/80 bg-[rgba(255,250,245,0.96)] p-4 shadow-[0_18px_40px_rgba(77,57,36,0.14)] backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium">{labels.columnPicker}</div>
                  <button
                    type="button"
                    className="text-xs text-[hsl(var(--muted-foreground))]"
                    onClick={() => setIsColumnPickerOpen(false)}
                  >
                    {labels.closeColumns}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {columnOptions.map((column) => (
                    <label key={column.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column.id)}
                        onChange={() => toggleColumn(column.id)}
                        className="h-4 w-4 rounded border-[hsl(var(--border))]"
                      />
                      <span>{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {!isSelectionMode ? (
            <Button type="button" variant="outline" onClick={() => setIsSelectionMode(true)}>
              {labels.enterSelection}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedIds([]);
                  setIsSelectionMode(false);
                }}
                disabled={isPending}
              >
                {labels.clearSelection}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={selectedIds.length === 0 || isPending}
              >
                {isPending ? labels.deleting : labels.deleteSelected}
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={labels.deleteSelectedTitle}
        description={labels.deleteSelectedConfirm}
        confirmLabel={labels.deleteSelected}
        cancelLabel={labels.cancel}
        isPending={isPending}
        onConfirm={deleteSelected}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(217,204,191,0.5)] bg-[rgba(255,252,248,0.82)] px-5 py-3 text-sm">
        <div className="text-[hsl(var(--muted-foreground))]">
          {labels.sortSummary} {sortSummaryText || labels.defaultSort}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="px-0 text-[hsl(var(--muted-foreground))]"
          onClick={() => {
            const next = new URLSearchParams(searchParams.toString());
            next.delete("sort");
            next.delete("order");
            router.push(`${pathname}?${next.toString()}`);
          }}
        >
          {labels.clearSort}
        </Button>
      </div>

      <div className="max-h-[68vh] overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[rgba(255,250,245,0.96)] text-xs uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))] backdrop-blur-xl">
              {isSelectionMode ? (
                <th className="px-3 py-4 font-medium">
                  <input
                    type="checkbox"
                    aria-label={labels.selectAll}
                    checked={allSelected}
                    onChange={(event) => toggleAll(event.target.checked)}
                    className="h-4 w-4 rounded border-[hsl(var(--border))]"
                  />
                </th>
              ) : null}
              <th className="whitespace-nowrap px-5 py-4 font-medium">
                <Link href={buildSortHref("name")} className="inline-flex items-center gap-1 transition hover:text-[hsl(var(--foreground))]">
                  <span>{labels.item}</span>
                  <span className="text-[11px]">{sortBadge("name") ?? " "}</span>
                </Link>
              </th>
              {activeColumns.map((column) => (
                <th key={column.id} className="whitespace-nowrap px-4 py-4 font-medium">
                  <Link
                    href={buildSortHref(column.id)}
                    className="inline-flex items-center gap-1 transition hover:text-[hsl(var(--foreground))]"
                  >
                    <span>{column.label}</span>
                    <span className="text-[11px]">{sortBadge(column.id) ?? " "}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((item) => (
              <tr
                key={item.id}
                className="group border-b border-[rgba(217,204,191,0.65)] bg-white/30 transition last:border-b-0 hover:bg-[rgba(255,255,255,0.82)]"
              >
                {isSelectionMode ? (
                  <td className="px-3 py-4 align-top">
                    <input
                      type="checkbox"
                      aria-label={`${labels.selectRow} ${item.name}`}
                      checked={selectedSet.has(item.id)}
                      onChange={(event) => toggleOne(item.id, event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[hsl(var(--border))]"
                    />
                  </td>
                ) : null}
                <td className="min-w-[280px] px-5 py-4">
                  <div>
                    <div className="flex items-start gap-3">
                      <Link href={`/${locale}/wardrobe/${item.id}`} className="min-w-0 flex-1">
                        <div className="flex items-center gap-4">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-14 w-12 shrink-0 rounded-[16px] border border-white/80 object-cover"
                            />
                          ) : (
                            <div
                              className={`h-14 w-12 shrink-0 rounded-[16px] border border-white/80 bg-gradient-to-br ${itemTint(item)} shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]`}
                            />
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium transition group-hover:text-[hsl(var(--primary))]">
                              <HighlightedText
                                text={getItemDisplayTitle(item, labels.unknownBrand, "")}
                                query={query}
                              />
                            </div>
                            <div className="group/details relative inline-block max-w-full">
                              <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                                <HighlightedText text={getItemDisplaySubtitle(item) || ""} query={query} />
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
                        </div>
                      </Link>
                      <div className="pt-1">
                        <AddToCandidatesButton
                          item={item}
                          labels={{
                            add: labels.addToCandidate,
                            added: labels.addedToCandidate,
                            remove: labels.removeFromCandidate,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                {activeColumns.map((column) => (
                  <td
                    key={`${item.id}-${column.id}`}
                    className={
                      ["price", "wearDays", "costPerWear", "favoriteScore"].includes(column.id)
                        ? "whitespace-nowrap px-4 py-4 font-medium text-[hsl(var(--foreground))]"
                        : "whitespace-nowrap px-4 py-4 text-[hsl(var(--muted-foreground))]"
                    }
                  >
                    {renderCell(item, column.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(217,204,191,0.5)] bg-[rgba(255,252,248,0.82)] px-5 py-3 text-sm">
        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
          <span>{labels.pageSize}</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
            }}
            className="rounded-full border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-sm"
          >
            {[20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage <= 1}
          >
            {labels.prevPage}
          </Button>
          <div className="min-w-24 text-center text-[hsl(var(--muted-foreground))]">
            {labels.page} {currentPage} / {totalPages}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage >= totalPages}
          >
            {labels.nextPage}
          </Button>
        </div>
      </div>
    </Card>
  );
}
