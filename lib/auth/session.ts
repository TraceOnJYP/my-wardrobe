import { getOptionalCurrentUser } from "@/lib/auth/current-user";
import { isAuthConfigured } from "@/lib/auth/provider-config";

export interface SessionUser {
  id: string;
  email: string;
  locale: "zh-CN" | "en-US";
  displayName?: string | null;
  avatarUrl?: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isAuthConfigured()) {
    const user = await getOptionalCurrentUser();

    if (user) {
      return {
        id: user.id,
        email: user.email ?? "unknown@smart-wardrobe.local",
        locale: user.locale === "en_US" ? "en-US" : "zh-CN",
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
      };
    }
  }

  if (process.env.ENABLE_DEMO_MODE === "false") {
    return null;
  }

  return {
    id: process.env.DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001",
    email: "demo@smart-wardrobe.local",
    locale: "zh-CN",
    displayName: "Demo User",
    avatarUrl: null,
  };
}

export async function requireSessionUser(): Promise<SessionUser | null> {
  if (isAuthConfigured()) {
    const user = await getOptionalCurrentUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? "unknown@smart-wardrobe.local",
      locale: user.locale === "en_US" ? "en-US" : "zh-CN",
      displayName: user.displayName ?? null,
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  return getSessionUser();
}
