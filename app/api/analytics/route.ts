import { ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { analyticsService } from "@/server/services/analytics.service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const summary = await analyticsService.getSummary({ userId: user.id });
  return ok(summary);
}
