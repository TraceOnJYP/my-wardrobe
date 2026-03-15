import { prisma } from "@/lib/prisma/client";
import type { CreateWardrobeItemDto } from "@/types/dto";
import type { WardrobeItem } from "@/types/item";

function buildItemName(input: CreateWardrobeItemDto) {
  return [input.brand, input.category].filter(Boolean).join(" ") || input.category;
}

function getDefaultPurchaseMeta(input: CreateWardrobeItemDto) {
  const now = new Date();
  return {
    purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : now,
    purchaseYear: input.purchaseYear ?? now.getUTCFullYear(),
  };
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mapWardrobeItem(record: {
  id: string;
  clientId: string | null;
  itemType: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  color: string | null;
  designElements: string | null;
  material: string | null;
  sleeveType: string | null;
  collarType: string | null;
  fit: string | null;
  silhouette: string | null;
  style: string | null;
  season: string[];
  scenario: string | null;
  size: string | null;
  tags: string[];
  price: { toNumber(): number } | null;
  priceRange: string | null;
  wearDays: number;
  useDays: number;
  costPerWear: { toNumber(): number };
  purchaseYear: number | null;
  purchaseDate: Date | null;
  purchaseChannel: string | null;
  ageYears: { toNumber(): number } | null;
  favoriteScore: number;
  notes: string | null;
  imageUrl: string | null;
  discardedAt: Date | null;
  deletedAt: Date | null;
  updatedAt: Date;
}): WardrobeItem {
  const effectivePurchaseDate = record.purchaseDate ?? record.updatedAt;

  return {
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
    purchaseYear: record.purchaseYear ?? effectivePurchaseDate.getUTCFullYear(),
    purchaseDate: toDateOnlyString(effectivePurchaseDate),
    purchaseChannel: record.purchaseChannel ?? undefined,
    ageYears: record.ageYears?.toNumber(),
    favoriteScore: record.favoriteScore,
    notes: record.notes ?? undefined,
    imageUrl: record.imageUrl ?? undefined,
    discardedAt: record.discardedAt ? toDateOnlyString(record.discardedAt) : undefined,
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : undefined,
    status: record.deletedAt ? "deleted" : record.discardedAt ? "discarded" : "active",
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function attachDerivedUsage(userId: string, items: WardrobeItem[]) {
  if (items.length === 0) return items;

  const usageRows = await prisma.ootdItem.groupBy({
    by: ["wardrobeItemId"],
    where: {
      wardrobeItemId: {
        in: items.map((item) => item.id),
      },
      ootdRecord: {
        userId,
        deletedAt: null,
      },
    },
    _count: {
      _all: true,
    },
  });

  const usageMap = new Map(usageRows.map((row) => [row.wardrobeItemId, row._count._all]));

  return items.map((item) => {
    const derivedCount = usageMap.get(item.id) ?? 0;
    const manualWearDays = item.manualWearDays ?? item.wearDays ?? 0;
    const manualUseDays = item.manualUseDays ?? item.useDays ?? 0;
    const ootdWearDays = derivedCount;
    const ootdUseDays = item.itemType === "bag" ? derivedCount : 0;
    const totalWearDays = manualWearDays + ootdWearDays;
    const dynamicCostPerWear =
      item.price !== undefined
        ? totalWearDays > 0
          ? Number((item.price / totalWearDays).toFixed(2))
          : item.price
        : item.costPerWear;

    return {
      ...item,
      manualWearDays,
      manualUseDays,
      ootdWearDays,
      ootdUseDays,
      wearDays: totalWearDays,
      useDays: manualUseDays + ootdUseDays,
      costPerWear: dynamicCostPerWear,
    };
  });
}

export const wardrobeService = {
  async ensureUser(userId: string) {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "demo@smart-wardrobe.local",
      },
    });
  },

  async createItem(params: { userId: string; input: CreateWardrobeItemDto }) {
    const { userId, input } = params;
    const defaultPurchaseMeta = getDefaultPurchaseMeta(input);

    await this.ensureUser(userId);

    const record = await prisma.wardrobeItem.create({
      data: {
        userId,
        clientId: input.clientId,
        itemType: input.itemType,
        name: buildItemName(input),
        brand: input.brand,
        category: input.category,
        subcategory: input.subcategory,
        color: input.color,
        designElements: input.designElements,
        material: input.material,
        sleeveType: input.sleeveType,
        collarType: input.collarType,
        fit: input.fit,
        silhouette: input.silhouette,
        style: input.style,
        season: input.season ?? [],
        scenario: input.scenario,
        size: input.size,
        tags: input.tags ?? [],
        price: input.price,
        priceRange: input.priceRange,
        wearDays: input.wearDays ?? 0,
        useDays: input.useDays ?? 0,
        costPerWear: input.costPerWear ?? 0,
        purchaseYear: defaultPurchaseMeta.purchaseYear,
        purchaseDate: defaultPurchaseMeta.purchaseDate,
        purchaseChannel: input.purchaseChannel,
        ageYears: input.ageYears,
        favoriteScore: input.favoriteScore ?? 0,
        notes: input.notes,
        imageUrl: input.imageUrl,
        discardedAt: null,
      },
    });

    const [item] = await attachDerivedUsage(userId, [mapWardrobeItem(record)]);
    return item;
  },

  async bulkImportItems(params: { userId: string; inputs: CreateWardrobeItemDto[] }) {
    const { userId, inputs } = params;

    await this.ensureUser(userId);

    if (inputs.length === 0) {
      return { importedCount: 0 };
    }

    const records = inputs.map((input) => {
      const defaultPurchaseMeta = getDefaultPurchaseMeta(input);

      return {
        userId,
        clientId: input.clientId,
        itemType: input.itemType,
        name: buildItemName(input),
        brand: input.brand,
        category: input.category,
        subcategory: input.subcategory,
        color: input.color,
        designElements: input.designElements,
        material: input.material,
        sleeveType: input.sleeveType,
        collarType: input.collarType,
        fit: input.fit,
        silhouette: input.silhouette,
        style: input.style,
        season: input.season ?? [],
        scenario: input.scenario,
        size: input.size,
        tags: input.tags ?? [],
        price: input.price,
        priceRange: input.priceRange,
        wearDays: input.wearDays ?? 0,
        useDays: input.useDays ?? 0,
        costPerWear: input.costPerWear ?? 0,
        purchaseYear: defaultPurchaseMeta.purchaseYear,
        purchaseDate: defaultPurchaseMeta.purchaseDate,
        purchaseChannel: input.purchaseChannel,
        ageYears: input.ageYears,
        favoriteScore: input.favoriteScore ?? 0,
        notes: input.notes,
        imageUrl: input.imageUrl,
        discardedAt: null,
      };
    });

    const result = await prisma.wardrobeItem.createMany({
      data: records,
    });

    return { importedCount: result.count };
  },

  async listItems(params: { userId: string }) {
    const records = await prisma.wardrobeItem.findMany({
      where: {
        userId: params.userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return attachDerivedUsage(params.userId, records.map(mapWardrobeItem));
  },

  async getItem(params: { userId: string; itemId: string }) {
    const record = await prisma.wardrobeItem.findFirst({
      where: {
        id: params.itemId,
        userId: params.userId,
        deletedAt: null,
      },
    });

    if (!record) return null;

    const [item] = await attachDerivedUsage(params.userId, [mapWardrobeItem(record)]);
    return item;
  },

  async updateItem(params: { userId: string; itemId: string; input: CreateWardrobeItemDto }) {
    const existing = await prisma.wardrobeItem.findFirst({
      where: {
        id: params.itemId,
        userId: params.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const record = await prisma.wardrobeItem.update({
      where: {
        id: params.itemId,
      },
      data: {
        itemType: params.input.itemType,
        name: buildItemName(params.input),
        brand: params.input.brand,
        category: params.input.category,
        subcategory: params.input.subcategory,
        color: params.input.color,
        designElements: params.input.designElements,
        material: params.input.material,
        sleeveType: params.input.sleeveType,
        collarType: params.input.collarType,
        fit: params.input.fit,
        silhouette: params.input.silhouette,
        style: params.input.style,
        season: params.input.season ?? [],
        scenario: params.input.scenario,
        size: params.input.size,
        tags: params.input.tags ?? [],
        price: params.input.price,
        priceRange: params.input.priceRange,
        wearDays: params.input.wearDays ?? 0,
        useDays: params.input.useDays ?? 0,
        costPerWear: params.input.costPerWear ?? 0,
        purchaseYear: params.input.purchaseYear,
        purchaseDate: params.input.purchaseDate ? new Date(params.input.purchaseDate) : undefined,
        purchaseChannel: params.input.purchaseChannel,
        ageYears: params.input.ageYears,
        favoriteScore: params.input.favoriteScore ?? 0,
        notes: params.input.notes,
        imageUrl: params.input.imageUrl,
        discardedAt: existing.discardedAt,
        version: {
          increment: 1,
        },
      },
    });

    const [item] = await attachDerivedUsage(params.userId, [mapWardrobeItem(record)]);
    return item;
  },

  async discardItem(params: { userId: string; itemId: string; discardedAt: string }) {
    const existing = await prisma.wardrobeItem.findFirst({
      where: {
        id: params.itemId,
        userId: params.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const record = await prisma.wardrobeItem.update({
      where: { id: params.itemId },
      data: {
        discardedAt: new Date(params.discardedAt),
        version: {
          increment: 1,
        },
      },
    });

    const [item] = await attachDerivedUsage(params.userId, [mapWardrobeItem(record)]);
    return item;
  },

  async restoreDiscardedItem(params: { userId: string; itemId: string }) {
    const existing = await prisma.wardrobeItem.findFirst({
      where: {
        id: params.itemId,
        userId: params.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const record = await prisma.wardrobeItem.update({
      where: { id: params.itemId },
      data: {
        discardedAt: null,
        version: {
          increment: 1,
        },
      },
    });

    const [item] = await attachDerivedUsage(params.userId, [mapWardrobeItem(record)]);
    return item;
  },

  async deleteItem(params: { userId: string; itemId: string }) {
    const existing = await prisma.wardrobeItem.findFirst({
      where: {
        id: params.itemId,
        userId: params.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    await prisma.wardrobeItem.update({
      where: {
        id: params.itemId,
      },
      data: {
        deletedAt: new Date(),
        version: {
          increment: 1,
        },
      },
    });

    return { id: params.itemId, deleted: true };
  },

  async bulkDeleteItems(params: { userId: string; itemIds: string[] }) {
    if (params.itemIds.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await prisma.wardrobeItem.updateMany({
      where: {
        userId: params.userId,
        id: {
          in: params.itemIds,
        },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        version: {
          increment: 1,
        },
      },
    });

    return { deletedCount: result.count };
  },
};
