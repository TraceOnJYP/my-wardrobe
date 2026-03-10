import { prisma } from "@/lib/prisma/client";

export const analyticsService = {
  async getSummary(params: { userId: string }) {
    const [totalItems, ootdCount, spendAggregate, unwornItemsCount] = await Promise.all([
      prisma.wardrobeItem.count({
        where: {
          userId: params.userId,
          deletedAt: null,
        },
      }),
      prisma.ootdRecord.count({
        where: {
          userId: params.userId,
          deletedAt: null,
        },
      }),
      prisma.wardrobeItem.aggregate({
        where: {
          userId: params.userId,
          deletedAt: null,
        },
        _sum: {
          price: true,
        },
      }),
      prisma.wardrobeItem.count({
        where: {
          userId: params.userId,
          deletedAt: null,
          wearDays: {
            lte: 0,
          },
        },
      }),
    ]);

    return {
      totalItems,
      totalSpend: Number(spendAggregate._sum.price ?? 0),
      totalOotdCount: ootdCount,
      unwornItemsCount,
    };
  },
};
