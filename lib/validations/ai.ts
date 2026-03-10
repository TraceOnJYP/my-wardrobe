import { z } from "zod";

export const recommendOutfitSchema = z.object({
  scenario: z.string().min(1),
  style: z.string().optional(),
  temperatureCelsius: z.number().optional(),
  locale: z.enum(["zh-CN", "en-US"]).optional(),
});
