import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser, requireSessionUser } from "@/lib/auth/session";
import { createWardrobeItemSchema } from "@/lib/validations/item";
import { getItems } from "@/features/wardrobe/api";
import { wardrobeService } from "@/server/services/wardrobe.service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const items = await getItems(user.locale);
  return ok(items.data);
}

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = createWardrobeItemSchema.safeParse(json);

  if (!parsed.success) {
    return badRequest("Invalid payload", parsed.error.flatten());
  }

  const item = await wardrobeService.createItem({ userId: user.id, input: parsed.data });
  return ok(item, { status: 201 });
}
