import { ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { getSearchItems } from "@/features/wardrobe/api";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const items = await getSearchItems(user.locale, {
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    color: searchParams.get("color") ?? undefined,
  });
  return ok(items.data);
}
