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
type InsightRange = "6" | "12" | "24";

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    type?: InsightTab;
    spendRange?: InsightRange;
    ootdRange?: InsightRange;
  }>;
}) {
  const { locale } = await params;
  const { type = "all", spendRange = "6", ootdRange = "6" } = await searchParams;
  const dict = await getDictionary(locale);
  const spendMonthRange = spendRange === "12" || spendRange === "24" ? Number(spendRange) : 6;
  const ootdMonthRange = ootdRange === "12" || ootdRange === "24" ? Number(ootdRange) : 6;
  const [spendSummary, ootdSummary] = await Promise.all([
    getAnalyticsSummary(locale, type, spendMonthRange as 6 | 12 | 24),
    getAnalyticsSummary(locale, type, ootdMonthRange as 6 | 12 | 24),
  ]);
  const summary = spendSummary;
  const tabs = [
    { value: "all", label: dict.wardrobe.types.all },
    { value: "clothing", label: dict.wardrobe.types.clothing },
    { value: "accessory", label: dict.wardrobe.types.accessory },
    { value: "bag", label: dict.wardrobe.types.bag },
    { value: "shoes", label: dict.wardrobe.types.shoes },
    { value: "jewelry", label: dict.wardrobe.types.jewelry },
    { value: "other", label: dict.wardrobe.types.other },
  ] as const satisfies Array<{ value: InsightTab; label: string }>;
  const rangeTabs = [
    { value: "6", label: locale === "zh-CN" ? "近 6 个月" : "6M" },
    { value: "12", label: locale === "zh-CN" ? "近 12 个月" : "12M" },
    { value: "24", label: locale === "zh-CN" ? "近 24 个月" : "24M" },
  ] as const satisfies Array<{ value: InsightRange; label: string }>;
  const getRangeLabel = (value: InsightRange) =>
    locale === "zh-CN" ? `最近 ${value} 个月` : `the last ${value} months`;
  const spendSubtitle =
    locale === "zh-CN"
      ? `按照购买时间统计${getRangeLabel(spendRange)}的消费变化。`
      : `Track spend changes over ${getRangeLabel(spendRange)} based on purchase dates.`;
  const ootdSubtitle =
    locale === "zh-CN"
      ? `${getRangeLabel(ootdRange)}的穿搭记录趋势。`
      : `Outfit activity across ${getRangeLabel(ootdRange)}.`;
  const renderRangeActions = (kind: "spend" | "ootd", currentRange: InsightRange) =>
    rangeTabs.map((tab) => (
      <Link
        key={tab.value}
        href={`/${locale}/insights?type=${type}&spendRange=${kind === "spend" ? tab.value : spendRange}&ootdRange=${kind === "ootd" ? tab.value : ootdRange}`}
        className={
          currentRange === tab.value
            ? "rounded-full bg-[rgba(121,82,48,0.12)] px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--foreground))] whitespace-nowrap"
            : "rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap transition hover:border-[hsl(var(--primary))/0.18] hover:bg-white hover:text-[hsl(var(--foreground))]"
        }
      >
        {tab.label}
      </Link>
    ));

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.insights.title} subtitle={dict.insights.subtitle} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/${locale}/insights?type=${tab.value}&spendRange=${spendRange}&ootdRange=${ootdRange}`}
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
          subtitle={spendSubtitle}
          entries={spendSummary.data.monthlySpendTrend}
          emptyText={dict.insights.empty}
          formatter={(value) => `¥${value}`}
          actions={renderRangeActions("spend", spendRange)}
        />
        <TrendCard
          title={dict.insights.modules.ootdTrend.title}
          subtitle={ootdSubtitle}
          entries={ootdSummary.data.monthlyOotdCounts}
          emptyText={dict.insights.empty}
          actions={renderRangeActions("ootd", ootdRange)}
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
