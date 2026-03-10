import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import type { AnalyticsTrendEntry } from "@/types/analytics";

export function TrendCard({
  title,
  subtitle,
  entries,
  emptyText,
  formatter,
  actions,
}: {
  title: string;
  subtitle?: string;
  entries: AnalyticsTrendEntry[];
  emptyText: string;
  formatter?: (value: number) => string;
  actions?: ReactNode;
}) {
  const maxValue = Math.max(...entries.map((entry) => entry.value), 1);
  const width = 560;
  const height = 220;
  const paddingX = 20;
  const paddingTop = 24;
  const paddingBottom = 34;
  const chartHeight = height - paddingTop - paddingBottom;
  const stepX = entries.length > 1 ? (width - paddingX * 2) / (entries.length - 1) : 0;
  const points = entries.map((entry, index) => {
    const x = paddingX + stepX * index;
    const y = paddingTop + chartHeight - (entry.value / maxValue) * chartHeight;
    return { ...entry, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</div> : null}
        </div>
        {actions ? <div className="ml-4 flex shrink-0 items-center gap-1.5 whitespace-nowrap">{actions}</div> : null}
      </div>

      {entries.length === 0 ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">{emptyText}</div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[24px] bg-[rgba(214,154,97,0.08)] px-3 py-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
              {[0, 0.5, 1].map((tick) => {
                const y = paddingTop + chartHeight - tick * chartHeight;
                return (
                  <line
                    key={tick}
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="rgba(121,82,48,0.12)"
                    strokeWidth="1"
                  />
                );
              })}
              <polyline
                fill="none"
                stroke="rgba(121,82,48,0.9)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polyline}
              />
              {points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="4.5" fill="rgba(121,82,48,1)" />
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    className="fill-[hsl(var(--foreground))] text-[11px] font-medium"
                  >
                    {formatter ? formatter(point.value) : point.value}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))` }}
          >
            {entries.map((entry) => (
              <div key={entry.label} className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                {entry.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
