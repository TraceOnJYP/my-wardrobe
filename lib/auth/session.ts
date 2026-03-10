import { headers } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  locale: "zh-CN" | "en-US";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const headerStore = await headers();
  const demoUser = headerStore.get("x-demo-user");

  if (!demoUser) {
    return {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@smart-wardrobe.local",
      locale: "zh-CN",
    };
  }

  return {
    id: demoUser,
    email: "demo@smart-wardrobe.local",
    locale: "zh-CN",
  };
}
