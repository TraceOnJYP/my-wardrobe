import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { wardrobeService } from "@/server/services/wardrobe.service";

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const json = await request.json().catch(() => null);
  const itemIds = Array.isArray(json?.itemIds)
    ? json.itemIds.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    : [];

  if (itemIds.length === 0) {
    return badRequest("Missing itemIds");
  }

  const result = await wardrobeService.bulkDeleteItems({
    userId: user.id,
    itemIds,
  });

  return ok(result);
}
