import { Card } from "@/components/ui/card";
import type { AnalyticsBreakdownEntry } from "@/types/analytics";

export function BreakdownCard({
  title,
  subtitle,
  entries,
  emptyText,
  formatter = (value) => String(value),
}: {
  title: string;
  subtitle?: string;
  entries: AnalyticsBreakdownEntry[];
  emptyText: string;
  formatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...entries.map((entry) => entry.value), 1);

  return (
    <Card className="space-y-4 p-6">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</div> : null}
      </div>

      {entries.length === 0 ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">{emptyText}</div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="truncate font-medium">{entry.label}</div>
                <div className="shrink-0 text-[hsl(var(--muted-foreground))]">
                  {formatter(entry.value)} · {entry.share}%
                </div>
              </div>
              <div className="h-2 rounded-full bg-[rgba(214,154,97,0.12)]">
                <div
                  className="h-2 rounded-full bg-[hsl(var(--primary))]"
                  style={{ width: `${Math.max(12, (entry.value / maxValue) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
