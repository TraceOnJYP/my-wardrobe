import { badRequest, notFound, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { createWardrobeItemSchema } from "@/lib/validations/item";
import { wardrobeService } from "@/server/services/wardrobe.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const item = await wardrobeService.getItem({ userId: user.id, itemId: id });

  if (!item) return notFound();
  return ok(item);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const json = await request.json();
  const parsed = createWardrobeItemSchema.safeParse(json);

  if (!parsed.success) {
    return badRequest("Invalid payload", parsed.error.flatten());
  }

  const item = await wardrobeService.updateItem({
    userId: user.id,
    itemId: id,
    input: parsed.data,
  });

  if (!item) return notFound();
  return ok(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!id) return notFound();

  const result = await wardrobeService.deleteItem({ userId: user.id, itemId: id });
  if (!result) return notFound();

  return ok(result);
}
