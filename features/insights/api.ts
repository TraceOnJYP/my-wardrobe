import { getItemDisplaySubtitle, getItemDisplayTitle } from "@/lib/item-display";
import { getOotdRecords } from "@/features/ootd/api";
import type { Locale } from "@/features/i18n/routing";
import { getItems } from "@/features/wardrobe/api";
import type {
  AnalyticsBreakdownEntry,
  AnalyticsHighlightGroup,
  AnalyticsItemEntry,
  AnalyticsSummary,
  AnalyticsTrendEntry,
} from "@/types/analytics";
import type { OotdRecord } from "@/types/ootd";
import type { WardrobeItem } from "@/types/item";

type InsightItemType = "all" | "clothing" | "accessory" | "bag" | "shoes" | "jewelry" | "other";
type InsightRange = 6 | 12 | "all";
const CORE_ITEM_TYPES = ["clothing", "accessory", "bag", "shoes", "jewelry"] as const;

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
  href?: string,
): AnalyticsItemEntry {
  const unknownBrand = locale === "zh-CN" ? "未记录品牌" : "Unknown brand";
  const noColor = locale === "zh-CN" ? "未记录颜色" : "No color";

  return {
    id: item.id,
    title: getItemDisplayTitle(item, unknownBrand, noColor),
    subtitle: getItemDisplaySubtitle(item),
    metricLabel,
    metricValue,
    href: href ?? `/${locale}/wardrobe/${item.id}`,
    item,
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

function subtractMonthsUtc(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, date.getUTCDate()));
}

function subtractYearsUtc(date: Date, years: number) {
  return new Date(Date.UTC(date.getUTCFullYear() - years, date.getUTCMonth(), date.getUTCDate()));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isCurrentSeasonItem(item: WardrobeItem, locale: Locale) {
  const month = new Date().getUTCMonth() + 1;
  const seasonKey =
    month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
  const values = item.season.map((entry) => entry.toLowerCase());

  if (values.some((entry) => entry.includes("四季") || entry.includes("all"))) {
    return true;
  }

  if (locale === "zh-CN") {
    const zhMap = {
      spring: "春",
      summer: "夏",
      autumn: "秋",
      winter: "冬",
    } as const;
    return values.some((entry) => entry.includes(zhMap[seasonKey]));
  }

  const enMap = {
    spring: ["spring"],
    summer: ["summer"],
    autumn: ["autumn", "fall"],
    winter: ["winter"],
  } as const;
  return values.some((entry) => enMap[seasonKey].some((keyword) => entry.includes(keyword)));
}

function getMonthlyTrend(
  records: Array<{ wearDate: string }>,
  locale: Locale,
  range: InsightRange,
): AnalyticsTrendEntry[] {
  if (range === "all") {
    const yearly = new Map<string, number>();
    for (const record of records) {
      const year = record.wearDate.slice(0, 4);
      yearly.set(year, (yearly.get(year) ?? 0) + 1);
    }

    return Array.from(yearly.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([label, value]) => ({ label, value }));
  }

  const now = new Date();
  const months = Array.from({ length: range }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (range - 1 - index), 1));
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

function getSpendTrend(
  items: WardrobeItem[],
  locale: Locale,
  range: InsightRange,
): AnalyticsTrendEntry[] {
  if (range === "all") {
    const yearly = new Map<string, number>();
    for (const item of items) {
      if (!item.purchaseDate) continue;
      const year = item.purchaseDate.slice(0, 4);
      yearly.set(year, (yearly.get(year) ?? 0) + (item.price ?? 0));
    }

    return Array.from(yearly.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([label, value]) => ({ label, value }));
  }

  const now = new Date();
  const months = Array.from({ length: range }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (range - 1 - index), 1));
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

function getLastWearMap(records: OotdRecord[]) {
  const map = new Map<string, string>();

  for (const record of records.filter((entry) => entry.recordType !== "look")) {
    for (const itemId of record.itemIds) {
      const current = map.get(itemId);
      if (!current || record.wearDate > current) {
        map.set(itemId, record.wearDate);
      }
    }
  }

  return map;
}

function matchesInsightType(itemType: string | undefined, type: InsightItemType) {
  if (type === "all") return true;
  if (type === "other") {
    return !CORE_ITEM_TYPES.includes((itemType ?? "") as (typeof CORE_ITEM_TYPES)[number]);
  }
  return itemType === type;
}

export async function getAnalyticsSummary(
  locale: Locale,
  type: InsightItemType = "all",
  range: InsightRange = 6,
): Promise<{ data: AnalyticsSummary }> {
  const [itemsResponse, recordsResponse] = await Promise.all([
    getItems(locale, type === "all" ? {} : { type }),
    getOotdRecords(locale),
  ]);
  const items = itemsResponse.data;
  const dailyRecords = recordsResponse.data.filter((record) => record.recordType !== "look");
  const filteredRecords =
    type === "all"
      ? dailyRecords
      : dailyRecords.filter((record) => record.items.some((item) => matchesInsightType(item.itemType, type)));
  const lastWearMap = getLastWearMap(dailyRecords);
  const oneYearAgoKey = toDateKey(subtractYearsUtc(new Date(), 1));
  const threeMonthsAgoKey = toDateKey(subtractMonthsUtc(new Date(), 3));

  const totalItems = items.length;
  const totalSpend = items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const costEligibleItems = items.filter((item) => (item.price ?? 0) > 0 || (item.costPerWear ?? 0) > 0);
  const averageCostPerWear =
    costEligibleItems.length > 0
      ? Number(
          (
            costEligibleItems.reduce((sum, item) => sum + getEffectiveCostPerWear(item), 0) /
            costEligibleItems.length
          ).toFixed(2),
        )
      : 0;
  const unwornLastYearItems = items.filter((item) => {
    if (!item.createdAt) return false;
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt > subtractYearsUtc(new Date(), 1)) {
      return false;
    }
    const lastWear = lastWearMap.get(item.id);
    return !lastWear || lastWear < oneYearAgoKey;
  });
  const unwornLastYearCount = unwornLastYearItems.length;

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
        locale === "zh-CN" ? "穿着总次数" : "Total wears",
        String(item.wearDays ?? 0),
      ),
    );

  const idleItems = [...unwornLastYearItems]
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
        locale === "zh-CN" ? "最近穿着" : "Last worn",
        lastWearMap.get(item.id) ?? (locale === "zh-CN" ? "最近一年无记录" : "No record in the last year"),
      ),
    );

  const costPerWearItems = [...costEligibleItems]
    .sort((left, right) => getEffectiveCostPerWear(right) - getEffectiveCostPerWear(left))
    .slice(0, 10)
    .map((item) =>
      buildItemEntry(
        item,
        locale,
        locale === "zh-CN" ? "平均穿搭成本" : "Average wear cost",
        `¥${formatCurrency(getEffectiveCostPerWear(item), locale)}`,
      ),
    );

  const recentClothingCounts = new Map<string, number>();
  const recentClothingItems = new Map<string, WardrobeItem>();
  for (const record of dailyRecords.filter((entry) => entry.wearDate >= threeMonthsAgoKey)) {
    for (const item of record.items.filter((entry) => matchesInsightType(entry.itemType, type))) {
      recentClothingCounts.set(item.id, (recentClothingCounts.get(item.id) ?? 0) + 1);
      if (!recentClothingItems.has(item.id)) {
        const fullItem = items.find((entry) => entry.id === item.id);
        if (fullItem) {
          recentClothingItems.set(item.id, fullItem);
        }
      }
    }
  }

  const recentTopClothingItems = Array.from(recentClothingCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .flatMap(([itemId, count]) => {
      const item = recentClothingItems.get(itemId);
      return item
        ? [
            buildItemEntry(
              item,
              locale,
              locale === "zh-CN" ? "近 3 个月穿着次数" : "Wears in last 3 months",
              String(count),
            ),
          ]
        : [];
    });

  const seasonalCostGroupsMap = new Map<string, WardrobeItem[]>();
  for (const item of items.filter((entry) => matchesInsightType(entry.itemType, type) && isCurrentSeasonItem(entry, locale))) {
    const groupKey = item.category || (locale === "zh-CN" ? "未分类" : "Uncategorized");
    seasonalCostGroupsMap.set(groupKey, [...(seasonalCostGroupsMap.get(groupKey) ?? []), item]);
  }

  const seasonalCostGroups: AnalyticsHighlightGroup[] = Array.from(seasonalCostGroupsMap.entries())
    .map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      items: [...groupItems]
        .sort((left, right) => getEffectiveCostPerWear(right) - getEffectiveCostPerWear(left))
        .slice(0, 3)
        .map((item) =>
          buildItemEntry(
            item,
            locale,
            locale === "zh-CN" ? "平均穿搭成本" : "Average wear cost",
            `¥${formatCurrency(getEffectiveCostPerWear(item), locale)}`,
          ),
        ),
    }))
    .filter((group) => group.items.length > 0)
    .sort((left, right) => {
      const leftValue = Number(left.items[0]?.metricValue.replace(/[^\d.]/g, "") ?? "0");
      const rightValue = Number(right.items[0]?.metricValue.replace(/[^\d.]/g, "") ?? "0");
      return rightValue - leftValue;
    });

  const seasonalCostByTypeItems = seasonalCostGroups
    .flatMap((group) => group.items)
    .sort((left, right) => {
      const leftValue = Number(left.metricValue.replace(/[^\d.]/g, "") ?? "0");
      const rightValue = Number(right.metricValue.replace(/[^\d.]/g, "") ?? "0");
      return rightValue - leftValue;
    })
    .slice(0, 10);

  const monthlyOotdCounts = getMonthlyTrend(filteredRecords, locale, range);
  const monthlySpendTrend = getSpendTrend(items, locale, range);

  return {
    data: {
      totalItems,
      totalSpend,
      averageCostPerWear,
      unwornLastYearCount,
      categoryBreakdown,
      colorBreakdown,
      brandBreakdown,
      spendByCategory,
      monthlySpendTrend,
      monthlyOotdCounts,
      topWornItems,
      idleItems,
      costPerWearItems,
      seasonalCostByTypeItems,
      seasonalCostGroups,
      recentTopClothingItems,
    },
  };
}
