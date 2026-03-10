import { HomeGuidanceCard } from "@/components/home/home-guidance-card";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/ui/card";
import { SummaryCards } from "@/components/insights/summary-cards";
import { OotdTimeline } from "@/components/ootd/ootd-timeline";
import { SyncStatusCard } from "@/components/profile/sync-status-card";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getAnalyticsSummary } from "@/features/insights/api";
import { getOotdRecords } from "@/features/ootd/api";
import { getItems } from "@/features/wardrobe/api";
import type { Locale } from "@/features/i18n/routing";
import { getItemDisplayTitle } from "@/lib/item-display";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const summary = await getAnalyticsSummary(locale);
  const [ootd, items] = await Promise.all([getOotdRecords(locale), getItems(locale)]);
  const sortedItems = [...items.data];
  const topWorn = sortedItems.sort((left, right) => (right.wearDays ?? 0) - (left.wearDays ?? 0))[0];
  const topIdle = [...items.data]
    .filter((item) => (item.wearDays ?? 0) <= 0)
    .sort((left, right) => (right.price ?? 0) - (left.price ?? 0))[0];
  const recentItemsCount = items.data.filter((item) => {
    const updatedAt = new Date(item.updatedAt).getTime();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return updatedAt >= thirtyDaysAgo;
  }).length;
  const unknownBrand = locale === "zh-CN" ? "未记录品牌" : "Unknown brand";
  const noColor = locale === "zh-CN" ? "未记录颜色" : "No color";
  const highlights = [
    {
      label: dict.home.highlights.topWornLabel,
      title: topWorn
        ? getItemDisplayTitle(topWorn, unknownBrand, noColor)
        : dict.home.highlights.emptyTitle,
      subtitle: topWorn
        ? `${dict.home.highlights.wearsPrefix}${topWorn.wearDays ?? 0}${dict.home.highlights.wearsSuffix}`
        : dict.home.highlights.emptySubtitle,
    },
    {
      label: dict.home.highlights.idleLabel,
      title: topIdle
        ? getItemDisplayTitle(topIdle, unknownBrand, noColor)
        : dict.home.highlights.emptyTitle,
      subtitle: topIdle
        ? `${dict.home.highlights.idlePrefix} ¥${topIdle.price ?? 0}`
        : dict.home.highlights.emptySubtitle,
    },
    {
      label: dict.home.highlights.recentLabel,
      title: `${recentItemsCount}`,
      subtitle: dict.home.highlights.recentSubtitle,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.home.title} subtitle={dict.home.subtitle} />
      <SummaryCards summary={summary.data} labels={dict.insights.cards} locale={locale} />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <HomeGuidanceCard
          title={dict.home.focus.title}
          subtitle={dict.home.focus.subtitle}
          highlights={highlights}
          primaryHref={`/${locale}/insights`}
          primaryLabel={dict.home.focus.primaryAction}
          secondaryHref={`/${locale}/wardrobe`}
          secondaryLabel={dict.home.focus.secondaryAction}
        />

        <Card className="relative z-30 space-y-4 overflow-visible p-6">
          <div>
            <div className="text-lg font-semibold">{dict.home.recent.title}</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{dict.home.recent.subtitle}</div>
          </div>
          <OotdTimeline records={ootd.data.slice(0, 3)} locale={locale} labels={dict.ootd.timeline} />
        </Card>
      </div>

      <SyncStatusCard text={dict.profile.syncStatus} className="relative z-0" />
    </div>
  );
}
