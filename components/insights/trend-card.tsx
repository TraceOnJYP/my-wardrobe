import { Card } from "@/components/ui/card";
import type { AnalyticsTrendEntry } from "@/types/analytics";

export function TrendCard({
  title,
  subtitle,
  entries,
  emptyText,
  formatter,
}: {
  title: string;
  subtitle?: string;
  entries: AnalyticsTrendEntry[];
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
        <div className="grid grid-cols-6 gap-3">
          {entries.map((entry) => (
            <div key={entry.label} className="flex flex-col items-center gap-2">
              <div className="text-xs font-medium">{formatter ? formatter(entry.value) : entry.value}</div>
              <div className="flex h-40 w-full items-end rounded-[20px] bg-[rgba(214,154,97,0.08)] p-2">
                <div
                  className="w-full rounded-[14px] bg-[linear-gradient(180deg,rgba(104,64,36,0.86),rgba(164,120,78,0.78))]"
                  style={{ height: `${Math.max(12, (entry.value / maxValue) * 100)}%` }}
                />
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{entry.label}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
