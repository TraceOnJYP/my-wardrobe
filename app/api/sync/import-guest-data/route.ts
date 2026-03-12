import { ok, unauthorized } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";

export async function POST() {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  return ok({
    items: [],
    ootdRecords: [],
    conflicts: [],
  });
}
