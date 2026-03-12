import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      locale?: "zh-CN" | "en-US";
      displayName?: string | null;
      avatarUrl?: string | null;
    };
  }
}
