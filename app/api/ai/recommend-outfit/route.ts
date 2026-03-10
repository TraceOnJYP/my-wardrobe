import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { recommendOutfitSchema } from "@/lib/validations/ai";
import { aiService } from "@/server/services/ai.service";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = recommendOutfitSchema.safeParse(json);

  if (!parsed.success) {
    return badRequest("Invalid payload", parsed.error.flatten());
  }

  const result = await aiService.recommend(parsed.data);
  return ok(result);
}
