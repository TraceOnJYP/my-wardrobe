import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { ootdService } from "@/server/services/ootd.service";
import { z } from "zod";

const addLooksToDaySchema = z.object({
  lookIds: z.array(z.string().uuid()).min(1),
  wearDate: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = addLooksToDaySchema.safeParse(json);

  if (!parsed.success) {
    return badRequest("Invalid payload", parsed.error.flatten());
  }

  try {
    await ootdService.addLooksToDay({
      userId: user.id,
      lookIds: parsed.data.lookIds,
      wearDate: parsed.data.wearDate,
    });
    return ok({ success: true });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to add looks to day");
  }
}
