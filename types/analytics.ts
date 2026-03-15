import type { WardrobeItem } from "@/types/item";

export interface AnalyticsBreakdownEntry {
  label: string;
  value: number;
  share: number;
}

export interface AnalyticsTrendEntry {
  label: string;
  value: number;
}

export interface AnalyticsItemEntry {
  id: string;
  title: string;
  subtitle?: string;
  metricLabel: string;
  metricValue: string;
  href?: string;
  item?: WardrobeItem;
  showSubtitle?: boolean;
}

export interface AnalyticsHighlightGroup {
  label: string;
  items: AnalyticsItemEntry[];
}

export interface AnalyticsSummary {
  totalItems: number;
  totalSpend: number;
  averageCostPerWear: number;
  unwornLastYearCount: number;
  categoryBreakdown: AnalyticsBreakdownEntry[];
  colorBreakdown: AnalyticsBreakdownEntry[];
  brandBreakdown: AnalyticsBreakdownEntry[];
  spendByCategory: AnalyticsBreakdownEntry[];
  monthlySpendTrend: AnalyticsTrendEntry[];
  monthlyOotdCounts: AnalyticsTrendEntry[];
  topWornItems: AnalyticsItemEntry[];
  idleItems: AnalyticsItemEntry[];
  costPerWearItems: AnalyticsItemEntry[];
  seasonalCostByTypeItems: AnalyticsItemEntry[];
  seasonalCostGroups: AnalyticsHighlightGroup[];
  recentTopClothingItems: AnalyticsItemEntry[];
}
