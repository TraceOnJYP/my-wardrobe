import { HomeGuidanceCard } from "@/components/home/home-guidance-card";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/ui/card";
import { SummaryCards } from "@/components/insights/summary-cards";
import { OotdTimeline } from "@/components/ootd/ootd-timeline";
import { SyncStatusCard } from "@/components/profile/sync-status-card";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getAnalyticsSummary } from "@/features/insights/api";
import { getOotdRecords } from "@/features/ootd/api";
import type { Locale } from "@/features/i18n/routing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const [summary, clothingSummary] = await Promise.all([
    getAnalyticsSummary(locale),
    getAnalyticsSummary(locale, "clothing"),
  ]);
  const ootd = await getOotdRecords(locale);
  const recentHighlights =
    clothingSummary.data.recentTopClothingItems.slice(0, 5).map((entry) => ({
      id: entry.id,
      label: dict.home.highlights.topWornLabel,
      title: entry.title,
      subtitle: `${dict.home.highlights.wearsPrefix}${entry.metricValue}${dict.home.highlights.wearsSuffix}`,
      href: entry.href,
      item: entry.item,
    })) || [];
  const highlights = [
    {
      label: dict.home.highlights.topWornLabel,
      items:
        recentHighlights.length > 0
          ? recentHighlights
          : [
              {
                id: "empty-top-worn",
                label: dict.home.highlights.topWornLabel,
                title: dict.home.highlights.emptyTitle,
                subtitle: dict.home.highlights.emptySubtitle,
              },
            ],
    },
    ...clothingSummary.data.seasonalCostGroups.map((group) => ({
      label:
        locale === "zh-CN"
          ? `${dict.home.highlights.seasonalCostLabel}${group.label}`
          : `${dict.home.highlights.seasonalCostLabel} ${group.label}`,
      items: group.items.map((entry) => ({
        id: entry.id,
        label: group.label,
        title: entry.title,
        subtitle: `${entry.metricLabel} · ${entry.metricValue}`,
        href: entry.href,
        item: entry.item,
      })),
    })),
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.home.title} subtitle={dict.home.subtitle} />
      <SummaryCards
        summary={summary.data}
        labels={dict.insights.cards}
        locale={locale}
        links={{ idle: `/${locale}/wardrobe?type=all&idle=year&view=list` }}
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <HomeGuidanceCard
          title={dict.home.focus.title}
          subtitle={dict.home.focus.subtitle}
          highlights={highlights}
          primaryHref={`/${locale}/insights`}
          primaryLabel={dict.home.focus.primaryAction}
          secondaryHref={`/${locale}/wardrobe`}
          secondaryLabel={dict.home.focus.secondaryAction}
          hoverLabels={{
            brand: dict.wardrobe.card.brand,
            category: dict.wardrobe.card.category,
            color: dict.wardrobe.card.color,
            designElements: dict.wardrobe.card.designElements,
            material: dict.wardrobe.card.material,
            season: dict.wardrobe.card.season,
            tags: dict.wardrobe.card.tags,
            price: dict.wardrobe.card.price,
            empty: dict.wardrobe.card.emptyDetails,
          }}
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
