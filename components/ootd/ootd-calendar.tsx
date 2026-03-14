"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getItemDisplayTitle } from "@/lib/item-display";
import type { OotdRecord } from "@/types/ootd";

function getMonthStart(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthValue] = month.split("-").map(Number);
    return new Date(Date.UTC(year, monthValue - 1, 1));
  }

  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function addMonths(date: Date, offset: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

function toMonthParam(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function toDateParam(date: Date, day: number) {
  const safeDay = Math.min(day, getDaysInMonth(date));
  return `${toMonthParam(date)}-${String(safeDay).padStart(2, "0")}`;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function formatMonthTitle(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

function buildRecordCardTitle(record: OotdRecord, labels: { daily: string }) {
  const scenario = record.scenario?.trim() || labels.daily;
  const notes = record.notes?.trim();
  return notes ? `${scenario} ${notes}` : scenario;
}

function buildRecordItemTitles(record: OotdRecord) {
  return record.items.map((item) => getItemDisplayTitle(item, "", "")).filter(Boolean);
}

export function OotdCalendar({
  locale,
  month,
  selectedDay,
  records,
  labels,
}: {
  locale: string;
  month?: string;
  selectedDay?: string;
  records: OotdRecord[];
  labels: {
    title: string;
    subtitle: string;
    previousMonth: string;
    nextMonth: string;
    todayAction: string;
    today: string;
    more: string;
    selectedDay: string;
    selectedDayEmpty: string;
    selectedDayHint: string;
    looksCount: string;
    openDetail: string;
    delete: string;
    deleting: string;
    deleteTitle: string;
    deleteConfirm: string;
    dailyLimitHint: string;
    fullDay: string;
    fullDayHint: string;
    select: string;
    clearSelection: string;
    deleteSelected: string;
    deleteSelectedTitle: string;
    deleteSelectedConfirm: string;
    cancel: string;
    selectedCount: string;
    moveUp: string;
    moveDown: string;
    itemCount: string;
    noImage: string;
    createToday: string;
    weekdays: string[];
  };
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [movingRecordId, setMovingRecordId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const monthStart = getMonthStart(month);
  const prevMonth = addMonths(monthStart, -1);
  const nextMonth = addMonths(monthStart, 1);
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - monthStart.getUTCDay());
  const todayKey = toLocalDateKey(now);
  const todayMonthParam = todayKey.slice(0, 7);
  const recordsByDay = new Map<string, OotdRecord[]>();

  for (const record of records) {
    const dayRecords = recordsByDay.get(record.wearDate) ?? [];
    dayRecords.push(record);
    recordsByDay.set(record.wearDate, dayRecords);
  }

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    const key = toDateKey(date);

    return {
      key,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthStart.getUTCMonth(),
      isToday: key === todayKey,
      records: recordsByDay.get(key) ?? [],
    };
  });
  const fallbackSelectedDay = days.find((day) => day.records.length > 0 && day.inMonth)?.key ?? days[0]?.key;
  const hasSelectedDay = selectedDay ? days.some((day) => day.key === selectedDay) : false;
  const activeDayKey = hasSelectedDay ? selectedDay : fallbackSelectedDay;
  const activeDay = days.find((day) => day.key === activeDayKey) ?? days[0];
  const activeDayNumber = activeDay?.day ?? 1;
  const prevMonthHref = `/${locale}/ootd?month=${toMonthParam(prevMonth)}&day=${toDateParam(prevMonth, activeDayNumber)}`;
  const nextMonthHref = `/${locale}/ootd?month=${toMonthParam(nextMonth)}&day=${toDateParam(nextMonth, activeDayNumber)}`;
  const activeDayIsFull = (activeDay?.records.length ?? 0) >= 5;

  useEffect(() => {
    const activeIds = new Set((activeDay?.records ?? []).map((record) => record.id));
    setSelectedRecordIds((current) => {
      const next = current.filter((id) => activeIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [activeDay?.key]);

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecordIds((current) =>
      current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId],
    );
  };

  const deleteSelectedRecords = async () => {
    if (selectedRecordIds.length === 0) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedRecordIds.map((recordId) =>
          fetch(`/api/ootd/${recordId}`, {
            method: "DELETE",
          }),
        ),
      );
      setSelectedRecordIds([]);
      setSelectionMode(false);
      setDeleteDialogOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const moveRecord = async (recordId: string, direction: "up" | "down") => {
    const activeDate = activeDay?.key;
    if (!activeDate) return;

    setMovingRecordId(recordId);
    try {
      await fetch(`/api/ootd/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wearDate: activeDate,
          direction,
        }),
      });
      router.refresh();
    } finally {
      setMovingRecordId(null);
    }
  };

  return (
    <Card className="h-full space-y-5 p-6">
      <div className="grid items-start gap-4 xl:grid-cols-[1.2fr_auto_0.8fr]">
        <div>
          <div className="text-xl font-semibold">{labels.title}</div>
          <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{labels.subtitle}</div>
        </div>
        <div className="flex justify-center xl:pt-1">
          <Link
            href={`/${locale}/ootd?month=${todayMonthParam}&day=${todayKey}`}
            className="inline-flex rounded-full border border-[rgba(214,154,97,0.45)] bg-[rgba(255,244,235,0.96)] px-4 py-2 text-center text-sm font-medium text-[hsl(var(--primary))] shadow-[0_8px_18px_rgba(77,57,36,0.08)]"
          >
            {labels.todayAction}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-2 xl:pt-1">
          <Link
            href={prevMonthHref}
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-white/70 bg-white/80 px-4 py-2 text-center text-sm font-medium"
          >
            {labels.previousMonth}
          </Link>
          <div className="min-w-[148px] text-center text-sm font-semibold">{formatMonthTitle(monthStart, locale)}</div>
          <Link
            href={nextMonthHref}
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-white/70 bg-white/80 px-4 py-2 text-center text-sm font-medium"
          >
            {labels.nextMonth}
          </Link>
        </div>
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 space-y-3">
          <div className="grid grid-cols-7 gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
            {labels.weekdays.map((weekday) => (
              <div key={weekday} className="rounded-[16px] px-2 py-2 text-center">
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const isActive = day.key === activeDay?.key;
              const href = `/${locale}/ootd?month=${toMonthParam(monthStart)}&day=${day.key}`;

              return (
                <Link
                  key={day.key}
                  href={href}
                  className={
                    day.inMonth
                      ? [
                          "min-h-[112px] rounded-[22px] border p-2.5 shadow-[0_10px_25px_rgba(77,57,36,0.05)] transition",
                          isActive
                            ? "border-[hsl(var(--primary))] bg-[rgba(255,247,238,0.98)]"
                            : "border-white/65 bg-white/78 hover:bg-white/88",
                        ].join(" ")
                      : "min-h-[112px] rounded-[22px] border border-white/45 bg-white/45 p-2.5 opacity-55"
                  }
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{day.day}</div>
                    {day.records.length > 0 ? (
                      <span className="rounded-full bg-[rgba(214,154,97,0.14)] px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--primary))]">
                        {day.records.length}
                      </span>
                    ) : day.isToday ? (
                      <span className="rounded-full bg-[rgba(214,154,97,0.16)] px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--primary))]">
                        {labels.today}
                      </span>
                    ) : null}
                  </div>

                  {day.records[0] ? (
                    <div className="space-y-2">
                      {day.records[0].imageUrl ? (
                        <img
                          src={day.records[0].imageUrl}
                          alt={day.records[0].itemTitles[0] ?? labels.title}
                          className="h-12 w-full rounded-[14px] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 items-center justify-center rounded-[14px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)] text-[10px] text-[hsl(var(--muted-foreground))]">
                          {labels.noImage}
                        </div>
                      )}
                      <div className="line-clamp-1 text-[11px] font-medium">
                        {day.records[0].itemTitles.slice(0, 2).join(" · ") || day.records[0].scenario || labels.title}
                      </div>
                      {day.records.length > 1 ? (
                        <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          +{day.records.length - 1} {labels.more}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/70 bg-[rgba(255,251,246,0.86)] p-4 shadow-[0_12px_28px_rgba(77,57,36,0.06)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                {labels.selectedDay}
              </div>
              <div className="mt-2 text-lg font-semibold">
                {formatSelectedDay(activeDay?.key ?? todayKey, locale)}
              </div>
              <div className="mt-1 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                {activeDay?.records.length
                  ? `${activeDay.records.length} ${labels.looksCount} · ${labels.dailyLimitHint}`
                  : labels.selectedDayEmpty}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {selectionMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedRecordIds([]);
                    }}
                  >
                    {labels.clearSelection}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={selectedRecordIds.length === 0 || isDeleting}
                  >
                    {isDeleting ? labels.deleting : labels.deleteSelected}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" className="shrink-0" onClick={() => setSelectionMode(true)}>
                    {labels.select}
                  </Button>
                  {activeDayIsFull ? (
                    <div className="shrink-0 whitespace-nowrap rounded-full border border-[rgba(214,154,97,0.3)] bg-[rgba(250,244,238,0.9)] px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                      {labels.fullDay}
                    </div>
                  ) : (
                    <Link
                      href={`/${locale}/ootd/candidates?day=${activeDay?.key ?? todayKey}`}
                      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-white/75 bg-white/88 px-4 py-2 text-sm font-medium shadow-[0_8px_18px_rgba(77,57,36,0.06)]"
                    >
                      {labels.createToday}
                    </Link>
                  )}
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
          isPending={isDeleting}
          onConfirm={deleteSelectedRecords}
          onCancel={() => setDeleteDialogOpen(false)}
        />

        {activeDay?.records.length ? (
            <div className="flex-1 space-y-3">
              {selectionMode ? (
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {labels.selectedCount} {selectedRecordIds.length}
                </div>
              ) : null}
              {activeDay.records.map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-start gap-3 rounded-[20px] border border-white/75 bg-white/85 p-3 transition hover:translate-y-[-1px]"
                >
                  {selectionMode ? (
                    <div className="mt-1 flex shrink-0 items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRecordSelection(record.id)}
                        className={
                          selectedRecordIds.includes(record.id)
                            ? "inline-flex h-5 w-5 items-center justify-center rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[10px] text-[hsl(var(--primary-foreground))]"
                            : "inline-flex h-5 w-5 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-white text-[10px] text-transparent"
                        }
                        aria-pressed={selectedRecordIds.includes(record.id)}
                      >
                        ✓
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveRecord(record.id, "up")}
                          disabled={index === 0 || movingRecordId === record.id}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-white text-xs disabled:opacity-35"
                          aria-label={labels.moveUp}
                          title={labels.moveUp}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRecord(record.id, "down")}
                          disabled={index === activeDay.records.length - 1 || movingRecordId === record.id}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-white text-xs disabled:opacity-35"
                          aria-label={labels.moveDown}
                          title={labels.moveDown}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {selectionMode ? (
                    <div className="flex min-w-0 flex-1 gap-3">
                      {record.imageUrl ? (
                        <img
                          src={record.imageUrl}
                          alt={record.itemTitles[0] ?? labels.title}
                          className="h-20 w-16 shrink-0 rounded-[16px] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)] text-[10px] text-[hsl(var(--muted-foreground))]">
                          {labels.noImage}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 font-medium">
                          {buildRecordCardTitle(record, labels)}
                        </div>
                        <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                          {buildRecordItemTitles(record).slice(0, 3).join(" · ") || labels.title}
                        </div>
                        <div className="group/record-count relative mt-2 inline-flex text-xs text-[hsl(var(--muted-foreground))]">
                          <span>{record.items.length} {labels.itemCount}</span>
                          <div className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[90] hidden min-w-[240px] max-w-[320px] rounded-[18px] border border-white/80 bg-[rgba(255,252,248,0.98)] p-3 shadow-[0_16px_35px_rgba(77,57,36,0.16)] backdrop-blur-xl group-hover/record-count:block">
                            <div className="space-y-1.5 text-xs leading-5 text-[hsl(var(--foreground))]">
                              {buildRecordItemTitles(record).map((title, titleIndex) => (
                                <div key={`${record.id}-item-title-${titleIndex}`} className="break-words font-medium">
                                  {title}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/${locale}/ootd/${record.id}?month=${toMonthParam(monthStart)}`}
                      className="flex min-w-0 flex-1 gap-3"
                    >
                      {record.imageUrl ? (
                        <img
                          src={record.imageUrl}
                          alt={record.itemTitles[0] ?? labels.title}
                          className="h-20 w-16 shrink-0 rounded-[16px] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)] text-[10px] text-[hsl(var(--muted-foreground))]">
                          {labels.noImage}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 font-medium">
                          {buildRecordCardTitle(record, labels)}
                        </div>
                        <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                          {buildRecordItemTitles(record).slice(0, 3).join(" · ") || labels.title}
                        </div>
                        <div className="group/record-count relative mt-2 inline-flex text-xs text-[hsl(var(--muted-foreground))]">
                          <span>{record.items.length} {labels.itemCount}</span>
                          <div className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[90] hidden min-w-[240px] max-w-[320px] rounded-[18px] border border-white/80 bg-[rgba(255,252,248,0.98)] p-3 shadow-[0_16px_35px_rgba(77,57,36,0.16)] backdrop-blur-xl group-hover/record-count:block">
                            <div className="space-y-1.5 text-xs leading-5 text-[hsl(var(--foreground))]">
                              {buildRecordItemTitles(record).map((title, titleIndex) => (
                                <div key={`${record.id}-item-title-${titleIndex}`} className="break-words font-medium">
                                  {title}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            activeDayIsFull ? (
              <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-[20px] border border-dashed border-[rgba(214,154,97,0.4)] bg-[rgba(250,246,241,0.88)] p-6 text-center">
                <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-[rgba(214,154,97,0.45)] text-xl font-medium text-[hsl(var(--muted-foreground))]">
                  5
                </span>
                <div className="text-sm font-medium text-[hsl(var(--foreground))]">{labels.fullDay}</div>
                <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{labels.fullDayHint}</div>
              </div>
            ) : (
              <Link
                href={`/${locale}/ootd/candidates?day=${activeDay?.key ?? todayKey}`}
                className="flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-[20px] border border-dashed border-[rgba(214,154,97,0.5)] bg-[rgba(255,252,248,0.88)] p-6 text-center transition hover:bg-[rgba(255,248,242,0.96)]"
              >
                <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-[rgba(214,154,97,0.6)] text-2xl font-light text-[hsl(var(--primary))]">
                  +
                </span>
                <div className="text-sm font-medium text-[hsl(var(--foreground))]">{labels.createToday}</div>
                <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{labels.selectedDayHint}</div>
              </Link>
            )
          )}
        </div>
      </div>
    </Card>
  );
}

function formatSelectedDay(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
