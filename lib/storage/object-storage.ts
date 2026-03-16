import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import OSS from "ali-oss";

const localUploadsDir = path.join(process.cwd(), "public", "uploads", "wardrobe");

type UploadFolder = "wardrobe" | "ootd";

interface UploadFileParams {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  folder?: UploadFolder;
}

interface UploadFileResult {
  key: string;
  url: string;
  fileName: string;
  storage: "oss" | "local";
}

export class ObjectStorageUploadError extends Error {
  code: "OSS_CONFIG" | "OSS_ACCESS_DENIED" | "OSS_UPLOAD_FAILED";

  constructor(code: ObjectStorageUploadError["code"], message: string) {
    super(message);
    this.name = "ObjectStorageUploadError";
    this.code = code;
  }
}

function getExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return extension || ".jpg";
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeRegion(value: string) {
  return value.startsWith("oss-") ? value.slice(4) : value;
}

function isOssConfigured() {
  return Boolean(
    process.env.OSS_BUCKET &&
      process.env.OSS_ACCESS_KEY_ID &&
      process.env.OSS_ACCESS_KEY_SECRET &&
      (process.env.OSS_REGION || process.env.OSS_ENDPOINT),
  );
}

function createOssClient() {
  const bucket = process.env.OSS_BUCKET;
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
  const region = process.env.OSS_REGION;
  const endpoint = process.env.OSS_ENDPOINT;

  if (!bucket || !accessKeyId || !accessKeySecret || (!region && !endpoint)) {
    throw new ObjectStorageUploadError("OSS_CONFIG", "OSS is not fully configured");
  }

  return new OSS({
    bucket,
    accessKeyId,
    accessKeySecret,
    region,
    endpoint,
    secure: true,
  });
}

function buildOssUrl(key: string) {
  const customBaseUrl = process.env.OSS_PUBLIC_BASE_URL?.trim();
  if (customBaseUrl) {
    return `${normalizeBaseUrl(customBaseUrl)}/${key}`;
  }

  const bucket = process.env.OSS_BUCKET?.trim();
  const endpoint = process.env.OSS_ENDPOINT?.trim();
  const region = process.env.OSS_REGION?.trim();

  if (bucket && endpoint) {
    const normalizedEndpoint = endpoint.replace(/^https?:\/\//, "");
    return `https://${bucket}.${normalizedEndpoint}/${key}`;
  }

  if (bucket && region) {
    return `https://${bucket}.oss-${normalizeRegion(region)}.aliyuncs.com/${key}`;
  }

  throw new Error("Unable to derive OSS public URL");
}

async function uploadToLocal(params: UploadFileParams): Promise<UploadFileResult> {
  const extension = getExtension(params.originalName);
  const fileName = `${crypto.randomUUID()}${extension}`;
  const targetPath = path.join(localUploadsDir, fileName);

  await mkdir(localUploadsDir, { recursive: true });
  await writeFile(targetPath, params.buffer);

  return {
    key: `uploads/wardrobe/${fileName}`,
    url: `/uploads/wardrobe/${fileName}`,
    fileName,
    storage: "local",
  };
}

async function uploadToOss(params: UploadFileParams): Promise<UploadFileResult> {
  const client = createOssClient();
  const prefix = process.env.OSS_PREFIX?.trim().replace(/^\/+|\/+$/g, "") || "smart-wardrobe";
  const folder = params.folder ?? "wardrobe";
  const extension = getExtension(params.originalName);
  const fileName = `${crypto.randomUUID()}${extension}`;
  const key = `${prefix}/${folder}/${fileName}`;

  await client.put(key, params.buffer, {
    headers: {
      "Content-Type": params.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  }).catch((error: unknown) => {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: string }).code) : "";
    if (code === "AccessDenied") {
      throw new ObjectStorageUploadError(
        "OSS_ACCESS_DENIED",
        "OSS rejected the upload. Check Bucket ACL and RAM PutObject permission.",
      );
    }

    throw new ObjectStorageUploadError("OSS_UPLOAD_FAILED", "Failed to upload image to OSS.");
  });

  return {
    key,
    url: buildOssUrl(key),
    fileName,
    storage: "oss",
  };
}

export async function uploadImageFile(params: UploadFileParams): Promise<UploadFileResult> {
  if (isOssConfigured()) {
    return uploadToOss(params);
  }

  return uploadToLocal(params);
}
