import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser, requireSessionUser } from "@/lib/auth/session";
import { createOotdSchema } from "@/lib/validations/ootd";
import { ootdService } from "@/server/services/ootd.service";
import { z } from "zod";

const moveOotdSchema = z.object({
  wearDate: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  const record = await ootdService.getRecord({ userId: user.id, recordId: id });

  if (!record) {
    return badRequest("OOTD record not found");
  }

  return ok(record);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = createOotdSchema.safeParse(json);

  if (!parsed.success) {
    return badRequest("Invalid payload", parsed.error.flatten());
  }

  try {
    const { id } = await context.params;
    const record = await ootdService.updateRecord({
      userId: user.id,
      recordId: id,
      input: parsed.data,
    });

    return ok(record);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to update OOTD");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  try {
    const { id } = await context.params;
    await ootdService.deleteRecord({ userId: user.id, recordId: id });
    return ok({ success: true });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to delete OOTD");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = moveOotdSchema.safeParse(json);

  if (!parsed.success) {
    return badRequest("Invalid payload", parsed.error.flatten());
  }

  try {
    const { id } = await context.params;
    await ootdService.moveRecord({
      userId: user.id,
      recordId: id,
      wearDate: parsed.data.wearDate,
      direction: parsed.data.direction,
    });
    return ok({ success: true });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to reorder OOTD");
  }
}
