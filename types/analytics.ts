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
}

export interface AnalyticsSummary {
  totalItems: number;
  totalSpend: number;
  totalOotdCount: number;
  unwornItemsCount: number;
  categoryBreakdown: AnalyticsBreakdownEntry[];
  colorBreakdown: AnalyticsBreakdownEntry[];
  brandBreakdown: AnalyticsBreakdownEntry[];
  spendByCategory: AnalyticsBreakdownEntry[];
  monthlySpendTrend: AnalyticsTrendEntry[];
  monthlyOotdCounts: AnalyticsTrendEntry[];
  topWornItems: AnalyticsItemEntry[];
  idleItems: AnalyticsItemEntry[];
  costPerWearItems: AnalyticsItemEntry[];
}
