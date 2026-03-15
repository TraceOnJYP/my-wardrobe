"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { WardrobeItem } from "@/types/item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ItemForm } from "@/components/wardrobe/item-form";
import { getItemDisplayCategory } from "@/lib/item-display";

type CategoryKey = "clothing" | "accessory" | "bag" | "shoes" | "jewelry";

interface FormDictionary {
  categories: Record<CategoryKey, string>;
  common: {
    tabsLabel: string;
    basicInfo: string;
    styleInfo: string;
    usageInfo: string;
    extraInfo: string;
    imagePanel: string;
    imageHint: string;
    imageCta: string;
    imageEmpty: string;
    notes: string;
    save: string;
    draft: string;
    saving: string;
    saveSuccess: string;
    saveError: string;
    required: string;
    customOption: string;
    customPlaceholder: string;
  };
  fields: Record<CategoryKey, string[]>;
  placeholders: Record<string, string>;
  options: {
    subcategory: Record<CategoryKey, string[]>;
    color: string[];
    material: string[];
    category: Record<CategoryKey, string[]>;
    size: string[];
  };
}

interface DetailDictionary {
  back: string;
  edit: string;
  delete: string;
  discard: string;
  restoreDiscard: string;
  discarded: string;
  discardDate: string;
  discardTitle: string;
  restoreDiscardTitle: string;
  discardConfirm: string;
  restoreDiscardConfirm: string;
  discarding: string;
  restoring: string;
  deleting: string;
  deleteTitle: string;
  deleteConfirm: string;
  cancel: string;
  overview: string;
  attributes: string;
  usage: string;
  manualWearDays: string;
  ootdWearDays: string;
  purchase: string;
  notes: string;
  noNotes: string;
  unknown: string;
}

function formatDate(value?: string, locale?: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatValue(value: string | number | undefined, fallback: string) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 py-2 text-sm">
      <div className="text-[hsl(var(--muted-foreground))]">{label}</div>
      <div className="min-w-0 font-medium">{value}</div>
    </div>
  );
}

export function ItemDetailShell({
  item,
  itemId,
  locale,
  formDict,
  detailDict,
}: {
  item: WardrobeItem;
  itemId: string;
  locale: string;
  formDict: FormDictionary;
  detailDict: DetailDictionary;
}) {
  const router = useRouter();
  const [currentItem, setCurrentItem] = useState(item);
  const [isEditing, setIsEditing] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [discardDate, setDiscardDate] = useState(item.discardedAt ?? new Date().toISOString().slice(0, 10));
  const [discardYear, discardMonth, discardDay] = discardDate.split("-").map(Number);
  const tags = currentItem.tags?.filter(Boolean) ?? [];
  const categoryLabel =
    (currentItem.itemType && formDict.categories[currentItem.itemType as CategoryKey]) || currentItem.category;

  useEffect(() => {
    setCurrentItem(item);
    setDiscardDate(item.discardedAt ?? new Date().toISOString().slice(0, 10));
  }, [item]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(`/${locale}/wardrobe`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      setIsDeleteDialogOpen(false);
      router.push(`/${locale}/wardrobe`);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDiscard = async () => {
    setIsDiscarding(true);
    try {
      const response = await fetch(`/api/items/${itemId}/discard`, currentItem.discardedAt
        ? {
            method: "DELETE",
          }
        : {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ discardedAt: discardDate }),
          });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      if (payload?.data) {
        setCurrentItem(payload.data);
      }
      setIsDiscardDialogOpen(false);
      router.refresh();
    } finally {
      setIsDiscarding(false);
    }
  };

  const updateDiscardDate = (next: { year?: number; month?: number; day?: number }) => {
    const nextYear = next.year ?? discardYear;
    const nextMonth = next.month ?? discardMonth;
    const nextDay = Math.min(next.day ?? discardDay, getDaysInMonth(nextYear, nextMonth));
    setDiscardDate(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`,
    );
  };

  const yearOptions = Array.from({ length: 11 }, (_, index) => new Date().getUTCFullYear() - 5 + index);
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
  const dayOptions = Array.from({ length: getDaysInMonth(discardYear, discardMonth) }, (_, index) => index + 1);

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={handleBack}>
            {detailDict.back}
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
            {detailDict.cancel}
          </Button>
        </div>
        <ItemForm
          dict={formDict}
          initialItem={currentItem}
          itemId={itemId}
          onSaved={(savedItem) => {
            setCurrentItem(savedItem);
            setIsEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={handleBack}>
          {detailDict.back}
        </Button>
        <div className="flex items-center gap-3">
          <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            {detailDict.delete}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDiscardDialogOpen(true)}
          >
            {currentItem.discardedAt ? detailDict.restoreDiscard : detailDict.discard}
          </Button>
          <Button type="button" onClick={() => setIsEditing(true)}>
            {detailDict.edit}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={detailDict.deleteTitle}
        description={detailDict.deleteConfirm}
        confirmLabel={detailDict.delete}
        cancelLabel={detailDict.cancel}
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      {isDiscardDialogOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(32,21,12,0.38)] p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-[rgba(255,250,245,0.98)] p-6 shadow-[0_24px_80px_rgba(54,36,20,0.18)]">
            <div className="space-y-2">
              <div className="text-xl font-semibold text-[hsl(var(--foreground))]">
                {currentItem.discardedAt ? detailDict.restoreDiscardTitle : detailDict.discardTitle}
              </div>
              <div className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {currentItem.discardedAt ? detailDict.restoreDiscardConfirm : detailDict.discardConfirm}
              </div>
            </div>
            {!currentItem.discardedAt ? (
              <div className="mt-5 space-y-2">
                <div className="text-sm font-medium">{detailDict.discardDate}</div>
                <SegmentedDatePicker
                  locale={locale}
                  year={discardYear}
                  month={discardMonth}
                  day={discardDay}
                  yearOptions={yearOptions}
                  monthOptions={monthOptions}
                  dayOptions={dayOptions}
                  onChange={updateDiscardDate}
                />
              </div>
            ) : null}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDiscardDialogOpen(false)} disabled={isDiscarding}>
                {detailDict.cancel}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDiscard} disabled={!currentItem.discardedAt && !discardDate || isDiscarding}>
                {isDiscarding ? (currentItem.discardedAt ? detailDict.restoring : detailDict.discarding) : (currentItem.discardedAt ? detailDict.restoreDiscard : detailDict.discard)}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                {categoryLabel}
              </div>
              <h2 className="text-2xl font-semibold">{currentItem.name}</h2>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {formatValue(currentItem.brand, detailDict.unknown)}
                {" · "}
                {formatValue(currentItem.color, detailDict.unknown)}
              </div>
            </div>
            {currentItem.imageUrl ? (
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="transition hover:scale-[1.02]"
              >
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.name}
                  className="h-28 w-24 rounded-[22px] border border-white/80 object-cover"
                />
              </button>
            ) : (
              <div className="h-28 w-24 rounded-[22px] border border-white/80 bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
            )}
          </div>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/80 bg-white/82 px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="rounded-[22px] border border-white/70 bg-white/70 p-4">
            <div className="mb-2 text-sm font-semibold">{detailDict.overview}</div>
            <DetailRow
              label={detailDict.discard}
              value={currentItem.discardedAt ? detailDict.discarded : detailDict.unknown}
            />
            <DetailRow
              label={detailDict.discardDate}
              value={currentItem.discardedAt ? formatDate(currentItem.discardedAt, locale) : detailDict.unknown}
            />
            <DetailRow label={formDict.placeholders.category} value={getItemDisplayCategory(currentItem)} />
            <DetailRow label={formDict.placeholders.brand} value={currentItem.brand ?? detailDict.unknown} />
            <DetailRow label={formDict.placeholders.color} value={currentItem.color ?? detailDict.unknown} />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="mb-2 text-sm font-semibold">{detailDict.attributes}</div>
            <DetailRow
              label={formDict.placeholders.designElements}
              value={currentItem.designElements ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.material}
              value={currentItem.material ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.sleeveType}
              value={currentItem.sleeveType ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.collarType}
              value={currentItem.collarType ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.fit}
              value={currentItem.fit ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.silhouette}
              value={currentItem.silhouette ?? detailDict.unknown}
            />
            <DetailRow label={formDict.placeholders.style} value={currentItem.style ?? detailDict.unknown} />
            <DetailRow
              label={formDict.placeholders.season}
              value={currentItem.season.length > 0 ? currentItem.season.join(" / ") : detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.scenario}
              value={currentItem.scenario ?? detailDict.unknown}
            />
          </Card>

          <Card className="p-6">
            <div className="mb-2 text-sm font-semibold">{detailDict.usage}</div>
            <DetailRow
              label={detailDict.manualWearDays}
              value={currentItem.manualWearDays ?? 0}
            />
            <DetailRow
              label={detailDict.ootdWearDays}
              value={currentItem.ootdWearDays ?? 0}
            />
            <DetailRow
              label={formDict.placeholders.wearDays}
              value={currentItem.wearDays ?? 0}
            />
            <DetailRow
              label={formDict.placeholders.price}
              value={currentItem.price !== undefined ? currentItem.price : detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.costPerWear}
              value={currentItem.costPerWear}
            />
            <DetailRow
              label={formDict.placeholders.favoriteScore}
              value={currentItem.favoriteScore ?? detailDict.unknown}
            />
          </Card>

          <Card className="p-6">
            <div className="mb-2 text-sm font-semibold">{detailDict.purchase}</div>
            <DetailRow
              label={formDict.placeholders.purchaseYear}
              value={currentItem.purchaseYear ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.purchaseDate}
              value={formatDate(currentItem.purchaseDate, locale) ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.purchaseChannel}
              value={currentItem.purchaseChannel ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.ageYears}
              value={currentItem.ageYears ?? detailDict.unknown}
            />
            <DetailRow
              label={formDict.placeholders.priceRange}
              value={currentItem.priceRange ?? detailDict.unknown}
            />
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-2 text-sm font-semibold">{detailDict.notes}</div>
        <div className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">
          {currentItem.notes || detailDict.noNotes}
        </div>
      </Card>

      {isImageOpen && currentItem.imageUrl ? (
        <button
          type="button"
          onClick={() => setIsImageOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-6"
        >
          <img
            src={currentItem.imageUrl}
            alt={currentItem.name}
            className="max-h-[88vh] max-w-[88vw] rounded-[28px] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          />
        </button>
      ) : null}
    </div>
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

  const optionColumns = openPart === "year" ? "grid-cols-2" : "grid-cols-3";

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
    <div ref={rootRef} className="relative z-[220]">
      <div className="flex w-full items-center rounded-2xl border border-[hsl(var(--border))] bg-[rgba(250,244,238,0.9)] px-4 py-3 text-sm">
        <DateSegment
          label={locale === "zh-CN" ? `${year}年` : String(year)}
          active={openPart === "year"}
          onClick={() => setOpenPart((current) => (current === "year" ? null : "year"))}
        />
        <span className="text-[hsl(var(--muted-foreground))]">/</span>
        <DateSegment
          label={locale === "zh-CN" ? `${month}月` : String(month)}
          active={openPart === "month"}
          onClick={() => setOpenPart((current) => (current === "month" ? null : "month"))}
        />
        <span className="text-[hsl(var(--muted-foreground))]">/</span>
        <DateSegment
          label={locale === "zh-CN" ? `${day}日` : String(day)}
          active={openPart === "day"}
          onClick={() => setOpenPart((current) => (current === "day" ? null : "day"))}
        />
      </div>

      {openPart ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-[320] rounded-[22px] border border-white/75 bg-white/95 p-2 shadow-[0_16px_35px_rgba(77,57,36,0.12)]">
          <div className={`grid max-h-60 gap-2 overflow-auto pr-1 ${optionColumns}`}>
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
        "rounded-lg px-0.5 py-0.5 text-center transition",
        active ? "bg-[rgba(255,244,235,0.95)] text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
