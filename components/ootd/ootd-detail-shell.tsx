"use client";

import Link from "next/link";
import { useState } from "react";
import { DeleteOotdButton } from "@/components/ootd/delete-ootd-button";
import { Card } from "@/components/ui/card";
import type { OotdRecord } from "@/types/ootd";

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function OotdDetailShell({
  locale,
  month,
  record,
  labels,
  pageTitle,
}: {
  locale: string;
  month?: string;
  record: OotdRecord;
  pageTitle: string;
  labels: {
    title: string;
    subtitle: string;
    back: string;
    edit: string;
    delete: string;
    deleting: string;
    recordLabel: string;
    daily: string;
    overview: string;
    date: string;
    scenario: string;
    count: string;
    items: string;
    notes: string;
    noNotes: string;
    itemsTitle: string;
    itemsSubtitle: string;
    viewItem: string;
  };
}) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const backHref = month ? `/${locale}/ootd?month=${month}` : `/${locale}/ootd`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{labels.title}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={month ? `/${locale}/ootd/${record.id}/edit?month=${month}` : `/${locale}/ootd/${record.id}/edit`}
            className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium"
          >
            {labels.edit}
          </Link>
          <DeleteOotdButton
            recordId={record.id}
            redirectHref={backHref}
            label={labels.delete}
            pendingLabel={labels.deleting}
          />
          <Link
            href={backHref}
            className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium"
          >
            {labels.back}
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                {labels.recordLabel}
              </div>
              <h2 className="text-2xl font-semibold">{formatDate(record.wearDate, locale)}</h2>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {record.scenario || labels.daily}
              </div>
            </div>
            {record.imageUrl ? (
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="transition hover:scale-[1.02]"
              >
                <img
                  src={record.imageUrl}
                  alt={record.scenario || pageTitle}
                  className="h-28 w-24 rounded-[22px] border border-white/80 object-cover"
                />
              </button>
            ) : (
              <div className="h-28 w-24 rounded-[22px] border border-white/80 bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
            )}
          </div>

          <div className="rounded-[22px] border border-white/70 bg-white/72 p-4">
            <div className="mb-3 text-sm font-semibold">{labels.overview}</div>
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-[92px_1fr] gap-3">
                <div className="text-[hsl(var(--muted-foreground))]">{labels.date}</div>
                <div className="font-medium">{formatDate(record.wearDate, locale)}</div>
              </div>
              <div className="grid grid-cols-[92px_1fr] gap-3">
                <div className="text-[hsl(var(--muted-foreground))]">{labels.scenario}</div>
                <div className="font-medium">{record.scenario || labels.daily}</div>
              </div>
              <div className="grid grid-cols-[92px_1fr] gap-3">
                <div className="text-[hsl(var(--muted-foreground))]">{labels.count}</div>
                <div className="font-medium">
                  {record.items.length} {labels.items}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/70 bg-white/72 p-4">
            <div className="mb-3 text-sm font-semibold">{labels.notes}</div>
            <div className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {record.notes || labels.noNotes}
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <div className="text-lg font-semibold">{labels.itemsTitle}</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{labels.itemsSubtitle}</div>
          </div>

          <div className="grid gap-3">
            {record.items.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}/wardrobe/${item.id}`}
                className="flex items-center gap-3 rounded-[22px] border border-white/70 bg-white/78 p-3 transition hover:translate-y-[-1px]"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-16 w-14 rounded-[16px] object-cover" />
                ) : (
                  <div className="h-16 w-14 rounded-[16px] bg-[linear-gradient(160deg,#ead6c1,#f7f1e8)]" />
                )}
                <div className="min-w-0">
                  <div className="truncate font-medium">{item.name}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{labels.viewItem}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {isImageOpen && record.imageUrl ? (
        <button
          type="button"
          onClick={() => setIsImageOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-6"
        >
          <img
            src={record.imageUrl}
            alt={record.scenario || pageTitle}
            className="max-h-[88vh] max-w-[88vw] rounded-[28px] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          />
        </button>
      ) : null}
    </div>
  );
}
