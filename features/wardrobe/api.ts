import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { getIndexedWardrobeItemSearch, matchesIndexedSearchEntries } from "@/lib/search/item-search";
import { attachDerivedUsage } from "@/server/services/wardrobe.service";
import type { Locale } from "@/features/i18n/routing";
import type { WardrobeItem } from "@/types/item";

interface WardrobeQuery {
  q?: string;
  type?: string;
  category?: string;
  brand?: string;
  color?: string;
  idle?: string;
  sort?: string;
  order?: string;
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildSampleItems(locale: Locale): WardrobeItem[] {
  if (locale === "zh-CN") {
    return [
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "黑色羊毛大衣",
        brand: "COS",
        category: "服饰",
        subcategory: "大衣",
        color: "黑色",
        season: ["秋季", "冬季"],
        tags: ["极简", "通勤"],
        price: 1299,
        manualWearDays: 12,
        manualUseDays: 0,
        ootdWearDays: 0,
        ootdUseDays: 0,
        wearDays: 12,
        costPerWear: 108.25,
        discardedAt: undefined,
        status: "active",
        updatedAt: "2026-03-07T00:00:00Z",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "白色针织毛衣",
        brand: "Uniqlo",
        category: "服饰",
        subcategory: "毛衣",
        color: "白色",
        season: ["秋季", "冬季"],
        tags: ["日常"],
        price: 299,
        manualWearDays: 18,
        manualUseDays: 0,
        ootdWearDays: 0,
        ootdUseDays: 0,
        wearDays: 18,
        costPerWear: 16.61,
        discardedAt: undefined,
        status: "active",
        updatedAt: "2026-03-07T00:00:00Z",
      },
    ];
  }

  return [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Black Wool Coat",
      brand: "COS",
      category: "Clothing",
      subcategory: "Coat",
      color: "Black",
      season: ["Autumn", "Winter"],
      tags: ["Minimal", "Commute"],
      price: 1299,
      manualWearDays: 12,
      manualUseDays: 0,
      ootdWearDays: 0,
      ootdUseDays: 0,
      wearDays: 12,
      costPerWear: 108.25,
      discardedAt: undefined,
      status: "active",
      updatedAt: "2026-03-07T00:00:00Z",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "White Knit Sweater",
      brand: "Uniqlo",
      category: "Clothing",
      subcategory: "Sweater",
      color: "White",
      season: ["Autumn", "Winter"],
      tags: ["Casual"],
      price: 299,
      manualWearDays: 18,
      manualUseDays: 0,
      ootdWearDays: 0,
      ootdUseDays: 0,
      wearDays: 18,
      costPerWear: 16.61,
      discardedAt: undefined,
      status: "active",
      updatedAt: "2026-03-07T00:00:00Z",
    },
  ];
}

export async function getItems(locale: Locale, query: WardrobeQuery = {}) {
  const normalizedQuery = {
    q: query.q?.trim(),
    type: query.type?.trim(),
    category: query.category?.trim(),
    brand: query.brand?.trim(),
    color: query.color?.trim(),
    idle: query.idle?.trim(),
    sort: query.sort?.split(",")[0] ?? "",
    order: query.order?.split(",")[0] === "asc" ? "asc" : "desc",
  };
  const hasActiveQuery = Boolean(
    normalizedQuery.q ||
      (normalizedQuery.type && normalizedQuery.type !== "all") ||
      normalizedQuery.category ||
      normalizedQuery.brand ||
      normalizedQuery.color ||
      normalizedQuery.idle,
  );

  const filterLocalItems = (items: WardrobeItem[]) =>
    items
      .filter((item) => {
        const indexedSearch = getIndexedWardrobeItemSearch(item);
        const queryMatch = normalizedQuery.q
          ? matchesIndexedSearchEntries(indexedSearch.entries, normalizedQuery.q)
          : true;
        const typeMatch =
          !normalizedQuery.type || normalizedQuery.type === "all"
            ? true
            : normalizedQuery.type === "discarded"
              ? Boolean(item.discardedAt)
            : normalizedQuery.type === "other"
              ? !["clothing", "accessory", "bag", "shoes", "jewelry"].includes(item.itemType ?? "")
              : item.itemType === normalizedQuery.type;
        const categoryMatch = normalizedQuery.category
          ? [item.category, item.subcategory]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery.category.toLowerCase())
          : true;
        const brandMatch = normalizedQuery.brand
          ? (item.brand ?? "").toLowerCase().includes(normalizedQuery.brand.toLowerCase())
          : true;
        const colorMatch = normalizedQuery.color
          ? (item.color ?? "").toLowerCase().includes(normalizedQuery.color.toLowerCase())
          : true;
        return queryMatch && typeMatch && categoryMatch && brandMatch && colorMatch;
      });

  const sortItems = (items: WardrobeItem[]) =>
    [...items].sort((a, b) => {
        if (!normalizedQuery.sort) {
          return 0;
        }

        const direction = normalizedQuery.order === "asc" ? 1 : -1;

        if (normalizedQuery.sort === "wearDays") {
          return ((a.wearDays ?? 0) - (b.wearDays ?? 0)) * direction;
        }

        if (normalizedQuery.sort === "brand") {
          return (a.brand ?? "").localeCompare(b.brand ?? "", locale) * direction;
        }

        if (normalizedQuery.sort === "color") {
          return (a.color ?? "").localeCompare(b.color ?? "", locale) * direction;
        }

        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction;
      });

  try {
    const user = await getSessionUser();
    if (!user) {
      return { data: sortItems(filterLocalItems(buildSampleItems(locale))) };
    }

    const knownTypes = ["clothing", "accessory", "bag", "shoes", "jewelry"];
    const andFilters: Array<Record<string, unknown>> = [
      {
        userId: user.id,
        deletedAt: null,
      },
    ];

    if (normalizedQuery.type && normalizedQuery.type !== "all") {
      if (normalizedQuery.type === "discarded") {
        andFilters.push({
          discardedAt: {
            not: null,
          },
        });
      } else if (normalizedQuery.type === "other") {
        andFilters.push({
          NOT: {
            itemType: {
              in: knownTypes,
            },
          },
        });
      } else {
        andFilters.push({
          itemType: normalizedQuery.type,
        });
      }
    }

    if (normalizedQuery.category) {
      andFilters.push({
        OR: [
          { category: { contains: normalizedQuery.category, mode: "insensitive" } },
          { subcategory: { contains: normalizedQuery.category, mode: "insensitive" } },
        ],
      });
    }

    if (normalizedQuery.brand) {
      andFilters.push({
        brand: { contains: normalizedQuery.brand, mode: "insensitive" },
      });
    }

    if (normalizedQuery.color) {
      andFilters.push({
        color: { contains: normalizedQuery.color, mode: "insensitive" },
      });
    }

    const records = await prisma.wardrobeItem.findMany({
      where: {
        AND: andFilters,
      },
      ...(normalizedQuery.sort
        ? {
            orderBy:
              normalizedQuery.sort === "wearDays"
                ? { wearDays: normalizedQuery.order }
                : normalizedQuery.sort === "brand"
                  ? { brand: { sort: normalizedQuery.order, nulls: "last" as const } }
                  : normalizedQuery.sort === "color"
                    ? { color: { sort: normalizedQuery.order, nulls: "last" as const } }
                    : { updatedAt: normalizedQuery.order },
          }
        : { orderBy: { createdAt: "desc" as const } }),
    });

    if (records.length === 0 && !hasActiveQuery) {
      return { data: sortItems(filterLocalItems(buildSampleItems(locale))) };
    }

    const mappedRecords = records.map((record) => ({
      id: record.id,
      clientId: record.clientId ?? undefined,
      itemType: record.itemType,
      name: record.name,
      brand: record.brand ?? undefined,
      category: record.category,
      subcategory: record.subcategory ?? undefined,
      color: record.color ?? undefined,
      designElements: record.designElements ?? undefined,
      material: record.material ?? undefined,
      sleeveType: record.sleeveType ?? undefined,
      collarType: record.collarType ?? undefined,
      fit: record.fit ?? undefined,
      silhouette: record.silhouette ?? undefined,
      style: record.style ?? undefined,
      season: record.season,
      scenario: record.scenario ?? undefined,
      size: record.size ?? undefined,
      tags: record.tags,
      price: record.price?.toNumber(),
      priceRange: record.priceRange ?? undefined,
      manualWearDays: record.wearDays,
      manualUseDays: record.useDays,
      ootdWearDays: 0,
      ootdUseDays: 0,
      wearDays: record.wearDays,
      useDays: record.useDays,
      costPerWear: record.costPerWear.toNumber(),
      purchaseYear: record.purchaseYear ?? record.updatedAt.getUTCFullYear(),
      purchaseDate: toDateOnlyString(record.purchaseDate ?? record.updatedAt),
      purchaseChannel: record.purchaseChannel ?? undefined,
      ageYears: record.ageYears?.toNumber(),
      favoriteScore: record.favoriteScore,
      notes: record.notes ?? undefined,
      imageUrl: record.imageUrl ?? undefined,
      discardedAt: record.discardedAt ? toDateOnlyString(record.discardedAt) : undefined,
      deletedAt: record.deletedAt ? record.deletedAt.toISOString() : undefined,
      status: record.deletedAt ? "deleted" : record.discardedAt ? "discarded" : "active",
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));

    let derivedItems = await attachDerivedUsage(user.id, mappedRecords);

    if (normalizedQuery.idle === "year" && derivedItems.length > 0) {
      const cutoff = new Date();
      cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
      const activeRows = await prisma.ootdItem.findMany({
        where: {
          wardrobeItemId: {
            in: derivedItems.map((item) => item.id),
          },
          ootdRecord: {
            deletedAt: null,
            recordType: "daily",
            wearDate: {
              gte: cutoff,
            },
          },
        },
        select: {
          wardrobeItemId: true,
        },
        distinct: ["wardrobeItemId"],
      });
      const activeItemIds = new Set(activeRows.map((row) => row.wardrobeItemId));
      derivedItems = derivedItems.filter((item) => {
        if (!item.createdAt) return false;
        const createdAt = new Date(item.createdAt);
        if (Number.isNaN(createdAt.getTime()) || createdAt > cutoff) return false;
        return !activeItemIds.has(item.id);
      });
    }

    return {
      data: sortItems(filterLocalItems(derivedItems)),
    };
  } catch {
    return { data: sortItems(filterLocalItems(buildSampleItems(locale))) };
  }
}

export async function getSearchItems(locale: Locale, query: WardrobeQuery = {}) {
  return getItems(locale, query);
}
