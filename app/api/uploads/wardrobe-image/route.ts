import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { uploadImageFile } from "@/lib/storage/object-storage";

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return badRequest("Missing image file");
  }

  if (!file.type.startsWith("image/")) {
    return badRequest("Only image files are supported");
  }

  const uploaded = await uploadImageFile({
    buffer: Buffer.from(await file.arrayBuffer()),
    contentType: file.type || "image/jpeg",
    originalName: file.name,
    folder: "wardrobe",
  });

  return ok({
    url: uploaded.url,
    fileName: uploaded.fileName,
    storage: uploaded.storage,
  });
}
