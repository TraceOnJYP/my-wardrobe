import { z } from "zod";

export const createWardrobeItemSchema = z
  .object({
    clientId: z.string().uuid().optional(),
    itemType: z.enum(["clothing", "accessory", "bag", "shoes", "jewelry"]),
    brand: z.string().optional(),
    category: z.string().min(1),
    subcategory: z.string().optional(),
    color: z.string().optional(),
    designElements: z.string().optional(),
    material: z.string().optional(),
    sleeveType: z.string().optional(),
    collarType: z.string().optional(),
    fit: z.string().optional(),
    silhouette: z.string().optional(),
    style: z.string().optional(),
    season: z.array(z.string()).optional(),
    scenario: z.string().optional(),
    size: z.string().optional(),
    tags: z.array(z.string()).optional(),
    price: z.number().optional(),
    priceRange: z.string().optional(),
    wearDays: z.number().optional(),
    useDays: z.number().optional(),
    costPerWear: z.number().optional(),
    purchaseYear: z.number().optional(),
    purchaseDate: z.string().optional(),
    purchaseChannel: z.string().optional(),
    ageYears: z.number().optional(),
    favoriteScore: z.number().optional(),
    notes: z.string().optional(),
    imageUrl: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    const requiredByType: Record<string, string[]> = {
      clothing: ["brand", "category", "color", "material"],
      accessory: ["brand", "category", "color"],
      bag: ["brand", "category", "color", "size", "material"],
      shoes: ["brand", "category", "color"],
      jewelry: ["brand", "category", "color"],
    };

    for (const field of requiredByType[input.itemType]) {
      const value = input[field as keyof typeof input];
      if (typeof value !== "string" || value.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field} is required`,
        });
      }
    }
  });
