import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import type { CreateOotdDto } from "@/types/dto";
import type { OotdRecord } from "@/types/ootd";

function mapOotdRecord(record: {
  id: string;
  wearDate: Date;
  displayOrder: number;
  scenario: string | null;
  notes: string | null;
  imageUrl: string | null;
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
    };
  }>;
}): OotdRecord {
  return {
    id: record.id,
    wearDate: record.wearDate.toISOString().slice(0, 10),
    displayOrder: record.displayOrder,
    scenario: record.scenario ?? undefined,
    notes: record.notes ?? undefined,
    imageUrl: record.imageUrl ?? undefined,
    itemIds: record.ootdItems.map((item) => item.wardrobeItem.id),
    itemTitles: record.ootdItems.map((item) => item.wardrobeItem.name),
    items: record.ootdItems.map((item) => ({
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
    })),
  };
}

export const ootdService = {
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

    const wearDate = new Date(params.input.wearDate);
    const { start, end } = this.getDayRange(wearDate);

    const count = await prisma.ootdRecord.count({
      where: {
        userId: params.userId,
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

    const record = await prisma.ootdRecord.create({
      data: {
        userId: params.userId,
        clientId: params.input.clientId,
        wearDate: start,
        displayOrder: (lastRecord?.displayOrder ?? -1) + 1,
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

    const wearDate = new Date(params.input.wearDate);
    const { start, end } = this.getDayRange(wearDate);

    const count = await prisma.ootdRecord.count({
      where: {
        userId: params.userId,
        id: { not: params.recordId },
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

    const existingWearDate = existing.wearDate;
    let nextDisplayOrder = existing.displayOrder;

    if (existingWearDate.toISOString().slice(0, 10) !== start.toISOString().slice(0, 10)) {
      const lastRecord = await prisma.ootdRecord.findFirst({
        where: {
          userId: params.userId,
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
        wearDate: start,
        displayOrder: nextDisplayOrder,
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
              },
            },
          },
        },
      },
    });

    return records.map(mapOotdRecord);
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
              },
            },
          },
        },
      },
    });

    return record ? mapOotdRecord(record) : null;
  },
};
