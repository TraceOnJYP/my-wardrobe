import { Card } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/types/analytics";

export function SummaryCards({
  summary,
  labels,
  locale,
}: {
  summary: AnalyticsSummary;
  labels: { items: string; spend: string; ootd: string; idle: string };
  locale: string;
}) {
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);

  const cards = [
    { label: labels.items, value: summary.totalItems },
    { label: labels.spend, value: `¥${formatNumber(summary.totalSpend)}` },
    { label: labels.ootd, value: summary.totalOotdCount },
    { label: labels.idle, value: summary.unwornItemsCount },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold">{card.value}</div>
        </Card>
      ))}
    </div>
  );
}
