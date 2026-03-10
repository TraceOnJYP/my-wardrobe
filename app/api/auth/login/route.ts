import { ok } from "@/lib/api/response";

export async function POST() {
  return ok({
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@smart-wardrobe.local",
      locale: "zh-CN",
    },
    session: {
      accessToken: "demo-token",
    },
  });
}
