import Link from "next/link";

import { BreakdownCard } from "@/components/insights/breakdown-card";
import { RankingCard } from "@/components/insights/ranking-card";
import { SummaryCards } from "@/components/insights/summary-cards";
import { TrendCard } from "@/components/insights/trend-card";
import { SectionHeader } from "@/components/shared/section-header";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { Locale } from "@/features/i18n/routing";
import { getAnalyticsSummary } from "@/features/insights/api";

type InsightTab = "all" | "clothing" | "accessory" | "bag" | "shoes" | "jewelry" | "other";

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ type?: InsightTab }>;
}) {
  const { locale } = await params;
  const { type = "all" } = await searchParams;
  const dict = await getDictionary(locale);
  const summary = await getAnalyticsSummary(locale, type);
  const tabs = [
    { value: "all", label: dict.wardrobe.types.all },
    { value: "clothing", label: dict.wardrobe.types.clothing },
    { value: "accessory", label: dict.wardrobe.types.accessory },
    { value: "bag", label: dict.wardrobe.types.bag },
    { value: "shoes", label: dict.wardrobe.types.shoes },
    { value: "jewelry", label: dict.wardrobe.types.jewelry },
    { value: "other", label: dict.wardrobe.types.other },
  ] as const satisfies Array<{ value: InsightTab; label: string }>;

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.insights.title} subtitle={dict.insights.subtitle} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/${locale}/insights?type=${tab.value}`}
            className={
              type === tab.value
                ? "rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-[0_10px_24px_rgba(77,57,36,0.16)]"
                : "rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--primary))/0.18] hover:bg-white"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <SummaryCards summary={summary.data} labels={dict.insights.cards} locale={locale} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendCard
          title={dict.insights.modules.spendTrend.title}
          subtitle={dict.insights.modules.spendTrend.subtitle}
          entries={summary.data.monthlySpendTrend}
          emptyText={dict.insights.empty}
          formatter={(value) => `¥${value}`}
        />
        <TrendCard
          title={dict.insights.modules.ootdTrend.title}
          subtitle={dict.insights.modules.ootdTrend.subtitle}
          entries={summary.data.monthlyOotdCounts}
          emptyText={dict.insights.empty}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BreakdownCard
          title={dict.insights.modules.spend.title}
          subtitle={dict.insights.modules.spend.subtitle}
          entries={summary.data.spendByCategory}
          emptyText={dict.insights.empty}
          formatter={(value) => `¥${value}`}
        />
        <BreakdownCard
          title={dict.insights.modules.category.title}
          subtitle={dict.insights.modules.category.subtitle}
          entries={summary.data.categoryBreakdown}
          emptyText={dict.insights.empty}
        />
        <BreakdownCard
          title={dict.insights.modules.color.title}
          subtitle={dict.insights.modules.color.subtitle}
          entries={summary.data.colorBreakdown}
          emptyText={dict.insights.empty}
        />
        <BreakdownCard
          title={dict.insights.modules.brand.title}
          subtitle={dict.insights.modules.brand.subtitle}
          entries={summary.data.brandBreakdown}
          emptyText={dict.insights.empty}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <RankingCard
          locale={locale}
          title={dict.insights.modules.topWorn.title}
          subtitle={dict.insights.modules.topWorn.subtitle}
          entries={summary.data.topWornItems}
          emptyText={dict.insights.empty}
        />
        <RankingCard
          locale={locale}
          title={dict.insights.modules.idle.title}
          subtitle={dict.insights.modules.idle.subtitle}
          entries={summary.data.idleItems}
          emptyText={dict.insights.empty}
        />
        <RankingCard
          locale={locale}
          title={dict.insights.modules.costPerWear.title}
          subtitle={dict.insights.modules.costPerWear.subtitle}
          entries={summary.data.costPerWearItems}
          emptyText={dict.insights.empty}
        />
      </div>
    </div>
  );
}
