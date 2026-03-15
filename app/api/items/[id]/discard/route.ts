import { badRequest, notFound, ok, unauthorized } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { wardrobeService } from "@/server/services/wardrobe.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const json = await request.json();
  const discardedAt = typeof json?.discardedAt === "string" ? json.discardedAt : "";

  if (!discardedAt) {
    return badRequest("Discard date is required");
  }

  const item = await wardrobeService.discardItem({
    userId: user.id,
    itemId: id,
    discardedAt,
  });

  if (!item) return notFound();
  return ok(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const item = await wardrobeService.restoreDiscardedItem({
    userId: user.id,
    itemId: id,
  });

  if (!item) return notFound();
  return ok(item);
}
