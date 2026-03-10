import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { createOotdSchema } from "@/lib/validations/ootd";
import { getOotdRecords } from "@/features/ootd/api";
import { ootdService } from "@/server/services/ootd.service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const records = await getOotdRecords(user.locale);
  return ok(records.data);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = createOotdSchema.safeParse(json);

  if (!parsed.success) {
    return badRequest("Invalid payload", parsed.error.flatten());
  }

  try {
    const record = await ootdService.createRecord({ userId: user.id, input: parsed.data });
    return ok(record, { status: 201 });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to create OOTD");
  }
}
