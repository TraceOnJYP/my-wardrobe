"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

export function LookListShell({
  locale,
  records,
  labels,
}: {
  locale: string;
  records: OotdRecord[];
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
    addError: string;
    deleteError: string;
    wearDate: string;
    empty: string;
    dailyFallback: string;
    items: string;
    noNotes: string;
  };
}) {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wearDate, setWearDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const selectedCount = selectedIds.length;
  const canAddToDay = selectedCount > 0 && wearDate;

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
        <div className="flex flex-wrap items-center gap-3">
          {selectionMode ? (
            <>
              <label className="flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm">
                <span>{labels.wearDate}</span>
                <input
                  type="date"
                  value={wearDate}
                  onChange={(event) => setWearDate(event.target.value)}
                  className="bg-transparent outline-none"
                />
              </label>
              <Button type="button" onClick={addSelectedToDay} disabled={!canAddToDay || isPending}>
                {isPending ? labels.addingToDay : labels.addToDay}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={selectedCount === 0 || isDeleting}
              >
                {isDeleting ? labels.deletingSelected : labels.deleteSelected}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedIds([]);
                }}
              >
                {labels.clearSelection}
              </Button>
            </>
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

      {records.length === 0 ? (
        <Card className="p-6 text-sm text-[hsl(var(--muted-foreground))]">{labels.empty}</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {records.map((record) => {
            const active = selectedIds.includes(record.id);
            const itemTitles = record.items.slice(0, 3).map((item) => getItemDisplayTitle(item, "", ""));
            const content = (
              <>
                {record.imageUrl ? (
                  <img src={record.imageUrl} alt={record.scenario || labels.dailyFallback} className="h-40 w-full rounded-[20px] object-cover" />
                ) : (
                  <div className="h-40 w-full rounded-[20px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
                )}
                <div className="mt-4 space-y-2">
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
                    ? "rounded-[28px] border border-[hsl(var(--primary))] bg-[rgba(255,247,238,0.96)] p-4 text-left shadow-[0_14px_30px_rgba(77,57,36,0.12)]"
                    : "rounded-[28px] border border-white/70 bg-white/82 p-4 text-left shadow-[0_10px_24px_rgba(77,57,36,0.06)]"
                }
              >
                {content}
              </button>
            ) : (
              <Link
                key={record.id}
                href={`/${locale}/looks/${record.id}`}
                className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_10px_24px_rgba(77,57,36,0.06)] transition hover:translate-y-[-1px]"
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
