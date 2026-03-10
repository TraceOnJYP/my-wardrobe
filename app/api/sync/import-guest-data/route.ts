import { ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  return ok({
    items: [],
    ootdRecords: [],
    conflicts: [],
  });
}
