import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { AnalyticsItemEntry } from "@/types/analytics";

export function RankingCard({
  title,
  subtitle,
  entries,
  emptyText,
  locale,
}: {
  title: string;
  subtitle?: string;
  entries: AnalyticsItemEntry[];
  emptyText: string;
  locale: string;
}) {
  return (
    <Card className="space-y-4 p-6">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</div> : null}
      </div>

      {entries.length === 0 ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <Link
              key={entry.id}
              href={entry.href ?? `/${locale}/wardrobe/${entry.id}`}
              className="flex items-center justify-between gap-3 rounded-[20px] border border-white/70 bg-white/80 px-4 py-3 transition hover:translate-y-[-1px]"
            >
              <div className="min-w-0">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">#{index + 1}</div>
                <div className="truncate font-medium">{entry.title}</div>
                {entry.subtitle ? (
                  <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">{entry.subtitle}</div>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{entry.metricLabel}</div>
                <div className="font-semibold">{entry.metricValue}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
