import { getItemDisplaySubtitle, getItemDisplayTitle } from "@/lib/item-display";
import { getOotdRecords } from "@/features/ootd/api";
import type { Locale } from "@/features/i18n/routing";
import { getItems } from "@/features/wardrobe/api";
import type {
  AnalyticsBreakdownEntry,
  AnalyticsItemEntry,
  AnalyticsSummary,
  AnalyticsTrendEntry,
} from "@/types/analytics";
import type { WardrobeItem } from "@/types/item";

type InsightItemType = "all" | "clothing" | "accessory" | "bag" | "shoes" | "jewelry" | "other";

function roundShare(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function toBreakdownEntries(map: Map<string, number>, total: number, limit = 8): AnalyticsBreakdownEntry[] {
  return Array.from(map.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN"))
    .slice(0, limit)
    .map(([label, value]) => ({
      label,
      value,
      share: roundShare(value, total),
    }));
}

function buildItemEntry(
  item: WardrobeItem,
  locale: Locale,
  metricLabel: string,
  metricValue: string,
): AnalyticsItemEntry {
  const unknownBrand = locale === "zh-CN" ? "未记录品牌" : "Unknown brand";
  const noColor = locale === "zh-CN" ? "未记录颜色" : "No color";

  return {
    id: item.id,
    title: getItemDisplayTitle(item, unknownBrand, noColor),
    subtitle: getItemDisplaySubtitle(item),
    metricLabel,
    metricValue,
  };
}

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function getEffectiveCostPerWear(item: WardrobeItem) {
  if ((item.wearDays ?? 0) <= 0) {
    return item.price ?? item.costPerWear ?? 0;
  }

  if (item.costPerWear && item.costPerWear > 0) {
    return item.costPerWear;
  }

  return item.price ? item.price / item.wearDays : 0;
}

function buildMonthlyTrend(records: Array<{ wearDate: string }>, locale: Locale): AnalyticsTrendEntry[] {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
      month: "short",
      timeZone: "UTC",
    }).format(date);

    return { key, label };
  });

  return months.map((month) => ({
    label: month.label,
    value: records.filter((record) => record.wearDate.slice(0, 7) === month.key).length,
  }));
}

function buildMonthlySpendTrend(items: WardrobeItem[], locale: Locale): AnalyticsTrendEntry[] {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
      month: "short",
      timeZone: "UTC",
    }).format(date);

    return { key, label };
  });

  return months.map((month) => ({
    label: month.label,
    value: items
      .filter((item) => item.purchaseDate?.slice(0, 7) === month.key)
      .reduce((sum, item) => sum + (item.price ?? 0), 0),
  }));
}

export async function getAnalyticsSummary(
  locale: Locale,
  type: InsightItemType = "all",
): Promise<{ data: AnalyticsSummary }> {
  const [itemsResponse, recordsResponse] = await Promise.all([
    getItems(locale, type === "all" ? {} : { type }),
    getOotdRecords(locale),
  ]);
  const items = itemsResponse.data;
  const records =
    type === "all"
      ? recordsResponse.data
      : recordsResponse.data.filter((record) =>
          record.items.some((item) =>
            type === "other"
              ? !["clothing", "accessory", "bag", "shoes", "jewelry"].includes(item.itemType ?? "")
              : item.itemType === type,
          ),
        );

  const totalItems = items.length;
  const totalSpend = items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const totalOotdCount = records.length;
  const unwornItemsCount = items.filter((item) => (item.wearDays ?? 0) <= 0).length;

  const categoryMap = new Map<string, number>();
  const colorMap = new Map<string, number>();
  const brandMap = new Map<string, number>();
  const spendCategoryMap = new Map<string, number>();

  for (const item of items) {
    const category = item.category || (locale === "zh-CN" ? "未分类" : "Uncategorized");
    const color = item.color || (locale === "zh-CN" ? "未记录颜色" : "No color");
    const brand = item.brand || (locale === "zh-CN" ? "未记录品牌" : "Unknown brand");

    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
    colorMap.set(color, (colorMap.get(color) ?? 0) + 1);
    brandMap.set(brand, (brandMap.get(brand) ?? 0) + 1);
    spendCategoryMap.set(category, (spendCategoryMap.get(category) ?? 0) + (item.price ?? 0));
  }

  const categoryBreakdown = toBreakdownEntries(categoryMap, totalItems, 6);
  const colorBreakdown = toBreakdownEntries(colorMap, totalItems, 8);
  const brandBreakdown = toBreakdownEntries(brandMap, totalItems, 8);
  const spendByCategory = toBreakdownEntries(spendCategoryMap, totalSpend, 6);

  const topWornItems = [...items]
    .sort((left, right) => (right.wearDays ?? 0) - (left.wearDays ?? 0))
    .slice(0, 10)
    .map((item) =>
      buildItemEntry(
        item,
        locale,
        locale === "zh-CN" ? "穿着次数" : "Wear count",
        String(item.wearDays ?? 0),
      ),
    );

  const idleItems = [...items]
    .filter((item) => (item.wearDays ?? 0) <= 0)
    .sort((left, right) => {
      const priceDiff = (right.price ?? 0) - (left.price ?? 0);
      if (priceDiff !== 0) return priceDiff;
      return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
    })
    .slice(0, 10)
    .map((item) =>
      buildItemEntry(
        item,
        locale,
        locale === "zh-CN" ? "穿着次数" : "Wear count",
        String(item.wearDays ?? 0),
      ),
    );

  const costPerWearItems = [...items]
    .filter((item) => (item.price ?? 0) > 0 || (item.costPerWear ?? 0) > 0)
    .sort((left, right) => getEffectiveCostPerWear(right) - getEffectiveCostPerWear(left))
    .slice(0, 10)
    .map((item) =>
      buildItemEntry(
        item,
        locale,
        locale === "zh-CN" ? "单次价格" : "Cost per wear",
        `¥${formatCurrency(getEffectiveCostPerWear(item), locale)}`,
      ),
    );

  const monthlyOotdCounts = buildMonthlyTrend(records, locale);
  const monthlySpendTrend = buildMonthlySpendTrend(items, locale);

  return {
    data: {
      totalItems,
      totalSpend,
      totalOotdCount,
      unwornItemsCount,
      categoryBreakdown,
      colorBreakdown,
      brandBreakdown,
      spendByCategory,
      monthlySpendTrend,
      monthlyOotdCounts,
      topWornItems,
      idleItems,
      costPerWearItems,
    },
  };
}
