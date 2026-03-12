import { ok, unauthorized } from "@/lib/api/response";
import { getOptionalCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  const user = await getOptionalCurrentUser();

  if (!user) {
    return unauthorized();
  }

  return ok({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    locale: user.locale === "en_US" ? "en-US" : "zh-CN",
    timezone: user.timezone,
    providers: user.accounts.map((account) => account.provider),
    onboardingCompleted: user.onboardingCompleted,
  });
}
