"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getItemDisplayTitle } from "@/lib/item-display";
import type { OotdRecord } from "@/types/ootd";

function buildTitle(record: OotdRecord, fallback: string) {
  const scenario = record.scenario?.trim() || fallback;
  const notes = record.notes?.trim();
  return notes ? `${scenario} ${notes}` : scenario;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function LookListShell({
  locale,
  records,
  initialScenario,
  initialPage,
  labels,
}: {
  locale: string;
  records: OotdRecord[];
  initialScenario?: string;
  initialPage?: number;
  labels: {
    title: string;
    subtitle: string;
    create: string;
    select: string;
    clearSelection: string;
    selectedCount: string;
    addToDay: string;
    addingToDay: string;
    deleteSelected: string;
    deletingSelected: string;
    deleteSelectedTitle: string;
    deleteSelectedConfirm: string;
    cancel: string;
    addToDaySubtitle: string;
    addError: string;
    deleteError: string;
    wearDate: string;
    allScenarios: string;
    scenarioOptions: string[];
    empty: string;
    dailyFallback: string;
    items: string;
    noNotes: string;
    prevPage: string;
    nextPage: string;
    page: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wearDate, setWearDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [singleAddLookId, setSingleAddLookId] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>(initialScenario || "all");
  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1);
  const [year, month, day] = wearDate.split("-").map(Number);

  const selectedCount = selectedIds.length;
  const canAddToDay = selectedCount > 0 && wearDate;
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getUTCFullYear();
    return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
  }, []);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const dayOptions = useMemo(
    () => Array.from({ length: getDaysInMonth(year, month) }, (_, index) => index + 1),
    [month, year],
  );
  const filteredRecords = useMemo(
    () =>
      activeScenario === "all"
        ? records
        : records.filter((record) => (record.scenario?.trim() || labels.dailyFallback) === activeScenario),
    [activeScenario, labels.dailyFallback, records],
  );
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const pagedRecords = useMemo(
    () => filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRecords, safePage],
  );

  useEffect(() => {
    setActiveScenario(initialScenario || "all");
  }, [initialScenario]);

  useEffect(() => {
    setCurrentPage(initialPage || 1);
  }, [initialPage]);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const applyScenario = (scenario: string) => {
    setActiveScenario(scenario);
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams.toString());
    if (scenario === "all") {
      next.delete("scenario");
    } else {
      next.set("scenario", scenario);
    }
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const updatePage = (nextPage: number) => {
    setCurrentPage(nextPage);
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const updateWearDate = (next: { year?: number; month?: number; day?: number }) => {
    const nextYear = next.year ?? year;
    const nextMonth = next.month ?? month;
    const nextDay = Math.min(next.day ?? day, getDaysInMonth(nextYear, nextMonth));
    setWearDate(`${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`);
  };

  const addSelectedToDay = () => {
    if (!canAddToDay) return;

    startTransition(async () => {
      setErrorMessage(null);
      const response = await fetch("/api/looks/add-to-day", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lookIds: selectedIds,
          wearDate,
        }),
      });

      if (!response.ok) {
        setErrorMessage(labels.addError);
        return;
      }

      setSelectedIds([]);
      setSelectionMode(false);
      router.push(`/${locale}/ootd?month=${wearDate.slice(0, 7)}&day=${wearDate}`);
    });
  };

  const addSingleLookToDay = (lookId: string) => {
    startTransition(async () => {
      setErrorMessage(null);
      const response = await fetch("/api/looks/add-to-day", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lookIds: [lookId],
          wearDate,
        }),
      });

      if (!response.ok) {
        setErrorMessage(labels.addError);
        return;
      }

      setSingleAddLookId(null);
      router.push(`/${locale}/ootd?month=${wearDate.slice(0, 7)}&day=${wearDate}`);
    });
  };

  const deleteSelectedLooks = () => {
    if (selectedCount === 0) return;

    startDeleteTransition(async () => {
      setErrorMessage(null);

      const results = await Promise.all(
        selectedIds.map(async (recordId) => {
          const response = await fetch(`/api/ootd/${recordId}`, {
            method: "DELETE",
          });

          return response.ok;
        }),
      );

      if (results.some((ok) => !ok)) {
        setErrorMessage(labels.deleteError);
        return;
      }

      setSelectedIds([]);
      setSelectionMode(false);
      setDeleteDialogOpen(false);
      router.refresh();
    });
  };

  const toggleSelection = (recordId: string) => {
    setSelectedIds((current) =>
      current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{labels.title}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{labels.subtitle}</p>
        </div>
        <div className={selectionMode ? "relative z-20 flex flex-wrap items-center gap-3 lg:flex-nowrap" : "flex flex-wrap items-center gap-3"}>
          {selectionMode ? (
            <div className="flex flex-wrap items-center gap-3 whitespace-nowrap lg:flex-nowrap">
              <label className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-2 text-sm">
                <span className="shrink-0 text-[13px] text-[hsl(var(--muted-foreground))]">{labels.wearDate}</span>
                <div className={locale === "zh-CN" ? "w-[164px]" : "w-[138px]"}>
                  <SegmentedDatePicker
                    locale={locale}
                    year={year}
                    month={month}
                    day={day}
                    yearOptions={yearOptions}
                    monthOptions={monthOptions}
                    dayOptions={dayOptions}
                    onChange={updateWearDate}
                    compact
                  />
                </div>
              </label>
              <Button
                type="button"
                className="shrink-0 whitespace-nowrap"
                onClick={addSelectedToDay}
                disabled={!canAddToDay || isPending}
              >
                {isPending ? labels.addingToDay : labels.addToDay}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="shrink-0 whitespace-nowrap"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={selectedCount === 0 || isDeleting}
              >
                {isDeleting ? labels.deletingSelected : labels.deleteSelected}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 whitespace-nowrap"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedIds([]);
                }}
              >
                {labels.clearSelection}
              </Button>
            </div>
          ) : (
            <>
              <Link
                href={`/${locale}/looks/new`}
                className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
              >
                {labels.create}
              </Link>
              <Button type="button" variant="outline" onClick={() => setSelectionMode(true)}>
                {labels.select}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => applyScenario("all")}
          className={
            activeScenario === "all"
              ? "rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
              : "rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-medium"
          }
        >
          {labels.allScenarios}
        </button>
        {labels.scenarioOptions.map((scenario) => (
          <button
            key={scenario}
            type="button"
            onClick={() => applyScenario(scenario)}
            className={
              activeScenario === scenario
                ? "rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
                : "rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-medium"
            }
          >
            {scenario}
          </button>
        ))}
      </div>

      {selectionMode ? (
        <div className="space-y-1">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            {labels.selectedCount} {selectedCount}
          </div>
          {errorMessage ? <div className="text-sm text-red-700">{errorMessage}</div> : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteDialogOpen}
        title={labels.deleteSelectedTitle}
        description={labels.deleteSelectedConfirm}
        confirmLabel={labels.deleteSelected}
        cancelLabel={labels.cancel}
        isPending={isDeleting}
        onConfirm={deleteSelectedLooks}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {singleAddLookId && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(32,21,12,0.38)] p-4 backdrop-blur-[2px]">
              <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-[rgba(255,250,245,0.98)] p-6 shadow-[0_24px_80px_rgba(54,36,20,0.18)]">
                <div className="space-y-2">
                  <div className="text-xl font-semibold text-[hsl(var(--foreground))]">{labels.addToDay}</div>
                  <div className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{labels.addToDaySubtitle}</div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 text-sm font-medium">{labels.wearDate}</div>
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
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setSingleAddLookId(null)} disabled={isPending}>
                    {labels.cancel}
                  </Button>
                  <Button
                    type="button"
                    className="min-w-[112px]"
                    onClick={() => addSingleLookToDay(singleAddLookId)}
                    disabled={!wearDate || isPending}
                  >
                    {isPending ? labels.addingToDay : labels.addToDay}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {filteredRecords.length === 0 ? (
        <Card className="p-6 text-sm text-[hsl(var(--muted-foreground))]">{labels.empty}</Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagedRecords.map((record) => {
            const active = selectedIds.includes(record.id);
            const itemTitles = record.items.slice(0, 3).map((item) => getItemDisplayTitle(item, "", ""));
            const content = (
              <>
                {record.imageUrl ? (
                  <img src={record.imageUrl} alt={record.scenario || labels.dailyFallback} className="h-40 w-full rounded-[20px] object-cover" />
                ) : (
                  <div className="h-40 w-full rounded-[20px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
                )}
                <div className="mt-4 flex min-h-[132px] flex-1 flex-col space-y-2">
                  <div className="line-clamp-1 text-lg font-semibold">
                    {buildTitle(record, labels.dailyFallback)}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {record.items.length} {labels.items}
                  </div>
                  <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {itemTitles.map((title, index) => (
                      <div key={`${record.id}-${index}-${title}`} className="truncate">
                        {title}
                      </div>
                    ))}
                    {record.notes ? <div className="line-clamp-2">{record.notes}</div> : <div>{labels.noNotes}</div>}
                  </div>
                </div>
              </>
            );

            return selectionMode ? (
              <button
                key={record.id}
                type="button"
                onClick={() => toggleSelection(record.id)}
                className={
                  active
                    ? "flex h-full flex-col rounded-[28px] border border-[hsl(var(--primary))] bg-[rgba(255,247,238,0.96)] p-4 text-left shadow-[0_14px_30px_rgba(77,57,36,0.12)]"
                    : "flex h-full flex-col rounded-[28px] border border-white/70 bg-[rgba(255,250,245,0.86)] p-4 text-left shadow-[0_10px_24px_rgba(77,57,36,0.06)]"
                }
              >
                {content}
              </button>
            ) : (
              <div
                key={record.id}
                className="flex h-full flex-col rounded-[28px] border border-white/70 bg-[rgba(255,250,245,0.86)] p-4 shadow-[0_10px_24px_rgba(77,57,36,0.06)] transition hover:translate-y-[-1px]"
              >
                <Link href={`/${locale}/looks/${record.id}`} className="block flex-1">
                  {content}
                </Link>
                <div className="mt-4 flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[rgba(214,154,97,0.26)] bg-[rgba(250,244,238,0.96)] text-[hsl(var(--foreground))] hover:bg-[rgba(246,236,226,0.98)]"
                    onClick={() => setSingleAddLookId(record.id)}
                  >
                    {labels.addToDay}
                  </Button>
                </div>
              </div>
            );
          })}
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
      )}
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
  compact = false,
}: {
  locale: string;
  year: number;
  month: number;
  day: number;
  yearOptions: number[];
  monthOptions: number[];
  dayOptions: number[];
  onChange: (next: { year?: number; month?: number; day?: number }) => void;
  compact?: boolean;
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

  const optionColumns = openPart === "year" ? "grid-cols-2" : "grid-cols-3";

  return (
    <div ref={rootRef} className="relative z-[220]">
      <div
        className={[
          "flex w-full items-center rounded-2xl border border-[hsl(var(--border))] bg-[rgba(250,244,238,0.9)] text-sm",
          compact ? "px-2 py-1.5" : "px-4 py-3",
        ].join(" ")}
      >
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
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-[320] rounded-[22px] border border-white/75 bg-white/95 p-2 shadow-[0_16px_35px_rgba(77,57,36,0.12)] backdrop-blur-xl">
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
