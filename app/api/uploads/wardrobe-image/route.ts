import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

const uploadsDir = path.join(process.cwd(), "public", "uploads", "wardrobe");

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return badRequest("Missing image file");
  }

  if (!file.type.startsWith("image/")) {
    return badRequest("Only image files are supported");
  }

  const extension = path.extname(file.name) || ".jpg";
  const fileName = `${crypto.randomUUID()}${extension.toLowerCase()}`;
  const targetPath = path.join(uploadsDir, fileName);

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

  return ok({
    url: `/uploads/wardrobe/${fileName}`,
    fileName,
  });
}
