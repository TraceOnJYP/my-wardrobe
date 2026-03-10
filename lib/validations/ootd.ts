import { z } from "zod";

export const createOotdSchema = z.object({
  clientId: z.string().uuid().optional(),
  wearDate: z.string().min(1),
  scenario: z.string().trim().min(1),
  notes: z.string().optional(),
  itemIds: z.array(z.string().uuid()).min(1),
  imageUrl: z.string().optional(),
});
