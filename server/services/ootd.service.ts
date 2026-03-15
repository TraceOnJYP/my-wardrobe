import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import type { CreateOotdDto } from "@/types/dto";
import type { OotdRecord } from "@/types/ootd";

function mapOotdRecord(record: {
  id: string;
  wearDate: Date;
  recordType: "daily" | "look";
  sourceLookId?: string | null;
  displayOrder: number;
  isFavorite: boolean;
  scenario: string | null;
  notes: string | null;
  imageUrl: string | null;
  usedDates?: string[];
  ootdItems: Array<{
    wardrobeItem: {
      id: string;
      name: string;
      imageUrl: string | null;
      itemType: string;
      brand: string | null;
      category: string;
      subcategory: string | null;
      color: string | null;
      designElements: string | null;
      material: string | null;
      season: string[];
      tags: string[];
      price: Prisma.Decimal | number | null;
      discardedAt: Date | null;
      deletedAt: Date | null;
    };
  }>;
}): OotdRecord {
  const items = record.ootdItems.map((item) => ({
    id: item.wardrobeItem.id,
    name: item.wardrobeItem.name,
    imageUrl: item.wardrobeItem.imageUrl ?? undefined,
    itemType: item.wardrobeItem.itemType,
    brand: item.wardrobeItem.brand ?? undefined,
    category: item.wardrobeItem.category,
    subcategory: item.wardrobeItem.subcategory ?? undefined,
    color: item.wardrobeItem.color ?? undefined,
    designElements: item.wardrobeItem.designElements ?? undefined,
    material: item.wardrobeItem.material ?? undefined,
    season: item.wardrobeItem.season,
    tags: item.wardrobeItem.tags,
    price:
      item.wardrobeItem.price === null || item.wardrobeItem.price === undefined
        ? undefined
        : Number(item.wardrobeItem.price),
    discardedAt: item.wardrobeItem.discardedAt?.toISOString().slice(0, 10) ?? undefined,
    deletedAt: item.wardrobeItem.deletedAt?.toISOString() ?? undefined,
    status: item.wardrobeItem.deletedAt ? "deleted" : item.wardrobeItem.discardedAt ? "discarded" : "active",
  }));

  return {
    id: record.id,
    wearDate: record.wearDate.toISOString().slice(0, 10),
    recordType: record.recordType,
    sourceLookId: record.sourceLookId ?? undefined,
    displayOrder: record.displayOrder,
    isFavorite: record.isFavorite,
    scenario: record.scenario ?? undefined,
    notes: record.notes ?? undefined,
    imageUrl: record.imageUrl ?? undefined,
    usedDates: record.usedDates,
    itemIds: items.map((item) => item.id),
    itemTitles: items.map((item) => item.name),
    containsDeletedItems: items.some((item) => item.status === "deleted"),
    containsDiscardedItems: items.some((item) => item.status === "discarded"),
    items,
  };
}

function isItemDiscardedForDate(
  item: { discardedAt?: string | undefined; deletedAt?: string | undefined },
  wearDate: Date,
) {
  if (item.deletedAt) return true;
  if (!item.discardedAt) return false;
  return item.discardedAt <= wearDate.toISOString().slice(0, 10);
}

export const ootdService = {
  async getLookUsedDates(params: { userId: string; lookIds: string[] }) {
    if (params.lookIds.length === 0) {
      return new Map<string, string[]>();
    }

    const records = await prisma.ootdRecord.findMany({
      where: {
        userId: params.userId,
        recordType: "daily",
        sourceLookId: { in: params.lookIds },
        deletedAt: null,
      },
      orderBy: [{ wearDate: "desc" }, { createdAt: "desc" }],
      select: {
        sourceLookId: true,
        wearDate: true,
      },
    });

    const usedDatesByLookId = new Map<string, string[]>();

    for (const record of records) {
      if (!record.sourceLookId) continue;
      const dateKey = record.wearDate.toISOString().slice(0, 10);
      const current = usedDatesByLookId.get(record.sourceLookId) ?? [];
      if (!current.includes(dateKey)) {
        current.push(dateKey);
        usedDatesByLookId.set(record.sourceLookId, current);
      }
    }

    return usedDatesByLookId;
  },

  getDayRange(wearDate: Date) {
    const start = new Date(Date.UTC(wearDate.getUTCFullYear(), wearDate.getUTCMonth(), wearDate.getUTCDate()));
    const end = new Date(Date.UTC(wearDate.getUTCFullYear(), wearDate.getUTCMonth(), wearDate.getUTCDate() + 1));

    return { start, end };
  },

  async normalizeDayOrder(params: { userId: string; wearDate: Date }) {
    const { start, end } = this.getDayRange(params.wearDate);
    const records = await prisma.ootdRecord.findMany({
      where: {
        userId: params.userId,
        recordType: "daily",
        wearDate: {
          gte: start,
          lt: end,
        },
        deletedAt: null,
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
      },
    });

    await prisma.$transaction(
      records.map((record, index) =>
        prisma.ootdRecord.update({
          where: { id: record.id },
          data: { displayOrder: index },
        }),
      ),
    );
  },

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

  async createRecord(params: { userId: string; input: CreateOotdDto }) {
    await this.ensureUser(params.userId);

    const recordType = params.input.recordType ?? "daily";
    const wearDate = new Date(params.input.wearDate);
    const { start, end } = this.getDayRange(wearDate);

    let nextDisplayOrder = 0;

    if (recordType === "daily") {
      const availableItems = await prisma.wardrobeItem.count({
        where: {
          userId: params.userId,
          id: { in: params.input.itemIds },
          deletedAt: null,
          OR: [{ discardedAt: null }, { discardedAt: { gt: start } }],
        },
      });

      if (availableItems !== params.input.itemIds.length) {
        throw new Error("OOTD contains unavailable item");
      }

      const count = await prisma.ootdRecord.count({
        where: {
          userId: params.userId,
          recordType: "daily",
          wearDate: {
            gte: start,
            lt: end,
          },
          deletedAt: null,
        },
      });

      if (count >= 5) {
        throw new Error("Daily OOTD limit reached");
      }

      const lastRecord = await prisma.ootdRecord.findFirst({
        where: {
          userId: params.userId,
          recordType: "daily",
          wearDate: {
            gte: start,
            lt: end,
          },
          deletedAt: null,
        },
        orderBy: [{ displayOrder: "desc" }, { createdAt: "desc" }],
        select: {
          displayOrder: true,
        },
      });

      nextDisplayOrder = (lastRecord?.displayOrder ?? -1) + 1;
    }

    const record = await prisma.ootdRecord.create({
      data: {
        userId: params.userId,
        clientId: params.input.clientId,
        recordType,
        sourceLookId: null,
        wearDate: start,
        displayOrder: nextDisplayOrder,
        isFavorite: false,
        scenario: params.input.scenario,
        notes: params.input.notes,
        imageUrl: params.input.imageUrl,
        ootdItems: {
          create: params.input.itemIds.map((itemId, index) => ({
            wardrobeItemId: itemId,
            itemOrder: index,
          })),
        },
      },
      include: {
        ootdItems: {
          orderBy: {
            itemOrder: "asc",
          },
          include: {
            wardrobeItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                itemType: true,
                brand: true,
                category: true,
                subcategory: true,
                color: true,
                designElements: true,
                material: true,
                season: true,
                tags: true,
                price: true,
                discardedAt: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    return mapOotdRecord(record);
  },

  async updateRecord(params: { userId: string; recordId: string; input: CreateOotdDto }) {
    await this.ensureUser(params.userId);

    const existing = await prisma.ootdRecord.findFirst({
      where: {
        id: params.recordId,
        userId: params.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new Error("OOTD record not found");
    }

    const recordType = params.input.recordType ?? existing.recordType;
    const wearDate = new Date(params.input.wearDate);
    const { start, end } = this.getDayRange(wearDate);

    if (recordType === "daily") {
      const availableItems = await prisma.wardrobeItem.count({
        where: {
          userId: params.userId,
          id: { in: params.input.itemIds },
          deletedAt: null,
          OR: [{ discardedAt: null }, { discardedAt: { gt: start } }],
        },
      });

      if (availableItems !== params.input.itemIds.length) {
        throw new Error("OOTD contains unavailable item");
      }
    }

    const existingWearDate = existing.wearDate;
    let nextDisplayOrder = existing.displayOrder;

    if (recordType === "daily") {
      const count = await prisma.ootdRecord.count({
        where: {
          userId: params.userId,
          id: { not: params.recordId },
          recordType: "daily",
          deletedAt: null,
          wearDate: { gte: start, lt: end },
        }
      });

      if (count >= 5) {
        throw new Error("Daily OOTD limit reached");
      }

      if (
        existing.recordType !== "daily" ||
        existingWearDate.toISOString().slice(0, 10) !== start.toISOString().slice(0, 10)
      ) {
        const lastRecord = await prisma.ootdRecord.findFirst({
          where: {
            userId: params.userId,
            recordType: "daily",
            wearDate: {
              gte: start,
              lt: end,
            },
            deletedAt: null,
          },
          orderBy: [{ displayOrder: "desc" }, { createdAt: "desc" }],
          select: {
            displayOrder: true,
          },
        });
        nextDisplayOrder = (lastRecord?.displayOrder ?? -1) + 1;
      }
    } else {
      nextDisplayOrder = 0;
    }

    await prisma.ootdItem.deleteMany({
      where: {
        ootdRecordId: params.recordId,
      },
    });

    const record = await prisma.ootdRecord.update({
      where: {
        id: params.recordId,
      },
      data: {
        recordType,
        sourceLookId: recordType === "look" ? null : existing.sourceLookId,
        wearDate: start,
        displayOrder: nextDisplayOrder,
        isFavorite: existing.isFavorite,
        scenario: params.input.scenario,
        notes: params.input.notes,
        imageUrl: params.input.imageUrl,
        ootdItems: {
          create: params.input.itemIds.map((itemId, index) => ({
            wardrobeItemId: itemId,
            itemOrder: index,
          })),
        },
      },
      include: {
        ootdItems: {
          orderBy: {
            itemOrder: "asc",
          },
          include: {
            wardrobeItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                itemType: true,
                brand: true,
                category: true,
                subcategory: true,
                color: true,
                designElements: true,
                material: true,
                season: true,
                tags: true,
                price: true,
                discardedAt: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (existingWearDate.toISOString().slice(0, 10) !== start.toISOString().slice(0, 10)) {
      await this.normalizeDayOrder({ userId: params.userId, wearDate: existingWearDate });
      await this.normalizeDayOrder({ userId: params.userId, wearDate: start });
    }

    return mapOotdRecord(record);
  },

  async deleteRecord(params: { userId: string; recordId: string }) {
    const existing = await prisma.ootdRecord.findFirst({
      where: {
        id: params.recordId,
        userId: params.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        wearDate: true,
      },
    });

    if (!existing) {
      throw new Error("OOTD record not found");
    }

    await prisma.ootdRecord.update({
      where: {
        id: params.recordId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.normalizeDayOrder({ userId: params.userId, wearDate: existing.wearDate });
  },

  async moveRecord(params: { userId: string; recordId: string; wearDate: string; direction: "up" | "down" }) {
    const wearDate = new Date(params.wearDate);
    const { start, end } = this.getDayRange(wearDate);
    const records = await prisma.ootdRecord.findMany({
      where: {
        userId: params.userId,
        recordType: "daily",
        wearDate: {
          gte: start,
          lt: end,
        },
        deletedAt: null,
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        displayOrder: true,
      },
    });

    const currentIndex = records.findIndex((record) => record.id === params.recordId);
    if (currentIndex === -1) {
      throw new Error("OOTD record not found");
    }

    const targetIndex = params.direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= records.length) {
      return;
    }

    const next = [...records];
    const [current] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, current);

    await prisma.$transaction(
      next.map((record, index) =>
        prisma.ootdRecord.update({
          where: { id: record.id },
          data: { displayOrder: index },
        }),
      ),
    );
  },

  async listRecords(params: { userId: string }) {
    const records = await prisma.ootdRecord.findMany({
      where: {
        userId: params.userId,
        recordType: "daily",
        deletedAt: null,
      },
      orderBy: [
        { wearDate: "desc" },
        { displayOrder: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        ootdItems: {
          orderBy: {
            itemOrder: "asc",
          },
          include: {
            wardrobeItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                itemType: true,
                brand: true,
                category: true,
                subcategory: true,
                color: true,
                designElements: true,
                material: true,
                season: true,
                tags: true,
                price: true,
                discardedAt: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    return records.map(mapOotdRecord);
  },

  async listLooks(params: { userId: string }) {
    const records = await prisma.ootdRecord.findMany({
      where: {
        userId: params.userId,
        recordType: "look",
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        ootdItems: {
          orderBy: {
            itemOrder: "asc",
          },
          include: {
            wardrobeItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                itemType: true,
                brand: true,
                category: true,
                subcategory: true,
                color: true,
                designElements: true,
                material: true,
                season: true,
                tags: true,
                price: true,
                discardedAt: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    const usedDatesByLookId = await this.getLookUsedDates({
      userId: params.userId,
      lookIds: records.map((record) => record.id),
    });

    return records.map((record) =>
      mapOotdRecord({
        ...record,
        usedDates: usedDatesByLookId.get(record.id) ?? [],
      }),
    );
  },

  async getRecord(params: { userId: string; recordId: string }) {
    const record = await prisma.ootdRecord.findFirst({
      where: {
        id: params.recordId,
        userId: params.userId,
        deletedAt: null,
      },
      include: {
        ootdItems: {
          orderBy: {
            itemOrder: "asc",
          },
          include: {
            wardrobeItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                itemType: true,
                brand: true,
                category: true,
                subcategory: true,
                color: true,
                designElements: true,
                material: true,
                season: true,
                tags: true,
                price: true,
                discardedAt: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    const usedDates =
      record.recordType === "look"
        ? (await this.getLookUsedDates({ userId: params.userId, lookIds: [record.id] })).get(record.id) ?? []
        : undefined;

    return mapOotdRecord({
      ...record,
      usedDates,
    });
  },

  async setFavorite(params: { userId: string; recordId: string; isFavorite: boolean }) {
    const existing = await prisma.ootdRecord.findFirst({
      where: {
        id: params.recordId,
        userId: params.userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new Error("OOTD record not found");
    }

    const record = await prisma.ootdRecord.update({
      where: {
        id: params.recordId,
      },
      data: {
        isFavorite: params.isFavorite,
      },
      include: {
        ootdItems: {
          orderBy: {
            itemOrder: "asc",
          },
          include: {
            wardrobeItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                itemType: true,
                brand: true,
                category: true,
                subcategory: true,
                color: true,
                designElements: true,
                material: true,
                season: true,
                tags: true,
                price: true,
                discardedAt: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    const usedDates =
      record.recordType === "look"
        ? (await this.getLookUsedDates({ userId: params.userId, lookIds: [record.id] })).get(record.id) ?? []
        : undefined;

    return mapOotdRecord({
      ...record,
      usedDates,
    });
  },

  async addLooksToDay(params: { userId: string; lookIds: string[]; wearDate: string }) {
    const wearDate = new Date(params.wearDate);
    const { start, end } = this.getDayRange(wearDate);

    const looks = await prisma.ootdRecord.findMany({
      where: {
        userId: params.userId,
        recordType: "look",
        id: { in: params.lookIds },
        deletedAt: null,
      },
      include: {
        ootdItems: {
          orderBy: { itemOrder: "asc" },
          include: {
            wardrobeItem: {
              select: {
                id: true,
                discardedAt: true,
                deletedAt: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    if (looks.length === 0) {
      return;
    }

    const count = await prisma.ootdRecord.count({
      where: {
        userId: params.userId,
        recordType: "daily",
        wearDate: { gte: start, lt: end },
        deletedAt: null,
      },
    });

    if (count + looks.length > 5) {
      throw new Error("Daily OOTD limit reached");
    }

    const invalidLook = looks.find((look) =>
      look.ootdItems.some((item) => {
        const discardedAt = (item as { wardrobeItem?: { discardedAt?: Date | null; deletedAt?: Date | null } }).wardrobeItem?.discardedAt;
        const deletedAt = (item as { wardrobeItem?: { discardedAt?: Date | null; deletedAt?: Date | null } }).wardrobeItem?.deletedAt;
        if (deletedAt) return true;
        if (!discardedAt) return false;
        return discardedAt.toISOString().slice(0, 10) <= start.toISOString().slice(0, 10);
      }),
    );

    if (invalidLook) {
      throw new Error("Look contains unavailable item");
    }

    let nextDisplayOrder = count;
    await prisma.$transaction(
      looks.map((look) =>
        prisma.ootdRecord.create({
          data: {
            userId: params.userId,
            recordType: "daily",
            sourceLookId: look.id,
            wearDate: start,
            displayOrder: nextDisplayOrder++,
            scenario: look.scenario,
            notes: look.notes,
            imageUrl: look.imageUrl,
            ootdItems: {
              create: look.ootdItems.map((item) => ({
                wardrobeItemId: item.wardrobeItemId,
                itemOrder: item.itemOrder,
              })),
            },
          },
        }),
      ),
    );
  },
};
