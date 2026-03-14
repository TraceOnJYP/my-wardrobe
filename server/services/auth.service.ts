import { prisma } from "@/lib/prisma/client";

function isDemoModeEnabled() {
  return process.env.ENABLE_DEMO_MODE !== "false";
}

function getDemoUserId() {
  return process.env.DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";
}

export const authService = {
  async migrateDemoDataToUser(userId: string) {
    if (!isDemoModeEnabled()) {
      return { migratedItems: 0, migratedOotdRecords: 0 };
    }

    const demoUserId = getDemoUserId();

    if (!demoUserId || demoUserId === userId) {
      return { migratedItems: 0, migratedOotdRecords: 0 };
    }

    const [targetItemCount, targetOotdCount] = await Promise.all([
      prisma.wardrobeItem.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
      prisma.ootdRecord.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
    ]);

    if (targetItemCount > 0 || targetOotdCount > 0) {
      return { migratedItems: 0, migratedOotdRecords: 0 };
    }

    const [demoItems, demoOotdRecords] = await Promise.all([
      prisma.wardrobeItem.findMany({
        where: {
          userId: demoUserId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.ootdRecord.findMany({
        where: {
          userId: demoUserId,
          deletedAt: null,
        },
        orderBy: [{ wearDate: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          ootdItems: {
            orderBy: {
              itemOrder: "asc",
            },
          },
        },
      }),
    ]);

    if (demoItems.length === 0 && demoOotdRecords.length === 0) {
      return { migratedItems: 0, migratedOotdRecords: 0 };
    }

    return prisma.$transaction(async (tx) => {
      const wardrobeIdMap = new Map<string, string>();

      for (const item of demoItems) {
        const cloned = await tx.wardrobeItem.create({
          data: {
            userId,
            clientId: item.clientId,
            itemType: item.itemType,
            name: item.name,
            brand: item.brand,
            category: item.category,
            subcategory: item.subcategory,
            color: item.color,
            designElements: item.designElements,
            material: item.material,
            sleeveType: item.sleeveType,
            collarType: item.collarType,
            fit: item.fit,
            silhouette: item.silhouette,
            style: item.style,
            season: item.season,
            scenario: item.scenario,
            size: item.size,
            tags: item.tags,
            price: item.price,
            priceRange: item.priceRange,
            wearDays: item.wearDays,
            useDays: item.useDays,
            costPerWear: item.costPerWear,
            purchaseYear: item.purchaseYear,
            purchaseDate: item.purchaseDate,
            purchaseChannel: item.purchaseChannel,
            ageYears: item.ageYears,
            favoriteScore: item.favoriteScore,
            notes: item.notes,
            imageUrl: item.imageUrl,
            version: item.version,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
        });

        wardrobeIdMap.set(item.id, cloned.id);
      }

      for (const record of demoOotdRecords) {
        const clonedRecord = await tx.ootdRecord.create({
          data: {
            userId,
            clientId: record.clientId,
            recordType: record.recordType,
            wearDate: record.wearDate,
            displayOrder: record.displayOrder,
            scenario: record.scenario,
            notes: record.notes,
            imageUrl: record.imageUrl,
            version: record.version,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          },
        });

        const clonedItems = record.ootdItems
          .map((ootdItem) => {
            const wardrobeItemId = wardrobeIdMap.get(ootdItem.wardrobeItemId);

            if (!wardrobeItemId) {
              return null;
            }

            return {
              ootdRecordId: clonedRecord.id,
              wardrobeItemId,
              itemOrder: ootdItem.itemOrder,
              createdAt: ootdItem.createdAt,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        if (clonedItems.length > 0) {
          await tx.ootdItem.createMany({
            data: clonedItems,
          });
        }
      }

      return {
        migratedItems: demoItems.length,
        migratedOotdRecords: demoOotdRecords.length,
      };
    });
  },
};
