import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import type { CreateWardrobeItemDto } from "@/types/dto";
import { wardrobeService } from "@/server/services/wardrobe.service";

const supportedSheets = [
  "服饰清单",
  "配饰清单",
  "包清单",
  "鞋类清单",
  "贵重首饰清单",
] as const;

const imageFieldKeys = ["图片名", "图片文件名", "图片", "image_name", "image", "image_key"];
const identifierKeys = ["编号", "id", "ID"];
const uploadsDir = path.join(process.cwd(), "public", "uploads", "wardrobe");

type SupportedSheet = (typeof supportedSheets)[number];
type SheetRow = Record<string, string>;

interface ParsedSheet {
  sheetName: SupportedSheet;
  headers: string[];
  rowCount: number;
  previewRows: SheetRow[];
  rows: SheetRow[];
}

interface ImageArchiveEntry {
  originalName: string;
  normalizedName: string;
  baseName: string;
  extension: string;
  buffer: Buffer;
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function parseNumber(value: string) {
  const normalized = value.replace(/[,\s￥¥]/g, "");
  if (!normalized) return undefined;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : undefined;
}

function parseInteger(value: string) {
  const result = parseNumber(value);
  return Number.isFinite(result) ? Math.round(result as number) : undefined;
}

function parseDate(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;

  const direct = new Date(normalized);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  const excelSerial = Number(normalized);
  if (Number.isFinite(excelSerial)) {
    const parsed = XLSX.SSF.parse_date_code(excelSerial);
    if (parsed) {
      const utc = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return utc.toISOString();
    }
  }

  return undefined;
}

function parseList(value: string) {
  return normalizeText(value)
    .split(/[、,，/；;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildNameParts(parts: Array<string | undefined>) {
  return parts.filter((part) => normalizeText(part).length > 0);
}

function readWorkbook(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sheets: ParsedSheet[] = workbook.SheetNames.filter((name): name is SupportedSheet =>
    supportedSheets.includes(name as SupportedSheet),
  ).map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(worksheet, {
      header: 1,
      raw: false,
      defval: "",
    });
    const [headerRow, ...dataRows] = rows;
    const headers = (headerRow ?? []).map((value) => normalizeText(value)).filter(Boolean);
    const normalizedRows = dataRows
      .filter((row) => row.some((cell) => normalizeText(cell) !== ""))
      .map((row) =>
        Object.fromEntries(headers.map((header, index) => [header, normalizeText(row[index])])),
      );

    return {
      sheetName,
      headers,
      rowCount: normalizedRows.length,
      previewRows: normalizedRows.slice(0, 5),
      rows: normalizedRows,
    };
  });

  return {
    fileSheets: sheets,
    totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
  };
}

async function readImageArchive(file: File | null) {
  if (!file) return [];
  if (!/\.zip$/i.test(file.name)) {
    throw new Error("Only .zip image archives are supported");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buffer);
  const entries: ImageArchiveEntry[] = [];

  for (const [name, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(name)) continue;

    const fileBuffer = await zipEntry.async("nodebuffer");
    const fileName = path.basename(name);
    const extension = path.extname(fileName).toLowerCase();
    const baseName = path.basename(fileName, extension).toLowerCase();

    entries.push({
      originalName: fileName,
      normalizedName: fileName.toLowerCase(),
      baseName,
      extension,
      buffer: fileBuffer,
    });
  }

  return entries;
}

function mapRowToItem(sheetName: SupportedSheet, row: SheetRow): CreateWardrobeItemDto | null {
  const getText = (...keys: string[]) => {
    for (const key of keys) {
      const value = normalizeText(row[key]);
      if (value) return value;
    }
    return "";
  };

  const getList = (...keys: string[]) => {
    for (const key of keys) {
      const value = parseList(row[key]);
      if (value.length > 0) return value;
    }
    return [] as string[];
  };

  const getInteger = (...keys: string[]) => {
    for (const key of keys) {
      const value = parseInteger(row[key]);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const getNumber = (...keys: string[]) => {
    for (const key of keys) {
      const value = parseNumber(row[key]);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const getDate = (...keys: string[]) => {
    for (const key of keys) {
      const value = parseDate(row[key]);
      if (value) return value;
    }
    return undefined;
  };

  const getPurchaseMeta = () => {
    const purchaseDate = getDate("购买时间", "购入日期");
    const purchaseYear = getInteger("购入年份", "购买年份");
    const purchaseMonth = getInteger("购入月份", "购买月份");
    const purchaseDay = getInteger("购入日期", "购买日期");

    if (purchaseDate) {
      return {
        purchaseDate,
        purchaseYear: purchaseYear ?? Number(purchaseDate.slice(0, 4)),
      };
    }

    if (purchaseYear && purchaseMonth) {
      return {
        purchaseYear,
        purchaseDate: `${purchaseYear}-${String(purchaseMonth).padStart(2, "0")}-${String(Math.max(1, purchaseDay ?? 1)).padStart(2, "0")}`,
      };
    }

    return {
      purchaseYear,
      purchaseDate: undefined as string | undefined,
    };
  };

  switch (sheetName) {
    case "服饰清单": {
      const purchaseMeta = getPurchaseMeta();
      const category = getText("品类", "大类");
      const type = getText("类型", "类别");
      const subcategory = getText("款式", "小类");
      if (!category || !subcategory) return null;

      return {
        itemType: "clothing",
        brand: getText("品牌") || undefined,
        category: type || category,
        subcategory,
        color: getText("颜色") || undefined,
        designElements: getText("设计元素") || undefined,
        material: getText("材质") || undefined,
        sleeveType: getText("袖型") || undefined,
        collarType: getText("领型") || undefined,
        fit: getText("宽松度") || undefined,
        silhouette: getText("廓形") || undefined,
        style: getText("风格") || undefined,
        season: getList("季节"),
        price: getNumber("价格"),
        priceRange: getText("价格段") || undefined,
        wearDays: getInteger("穿着天数"),
        costPerWear: getNumber("单次价格"),
        purchaseYear: purchaseMeta.purchaseYear,
        purchaseDate: purchaseMeta.purchaseDate,
        purchaseChannel: getText("购入渠道", "购买渠道", "渠道") || undefined,
        ageYears: getNumber("衣服年龄"),
        favoriteScore: getInteger("喜爱指数"),
        tags: getList("标签", "搭配"),
        notes: buildNameParts([row["编号"], row["搭配"]]).join(" | ") || undefined,
      };
    }
    case "配饰清单": {
      const purchaseMeta = getPurchaseMeta();
      const category = getText("品类", "大类") || "配饰";
      const type = getText("类型", "类别");
      const subcategory = getText("款式", "小类");
      if (!subcategory) return null;

      return {
        itemType: "accessory",
        brand: getText("品牌") || undefined,
        category: type || category,
        subcategory,
        color: getText("颜色", "色系") || undefined,
        designElements: getText("设计元素") || undefined,
        season: getList("季节"),
        price: getNumber("价格"),
        priceRange: getText("价格段") || undefined,
        wearDays: getInteger("穿着天数"),
        costPerWear: getNumber("单次价格"),
        purchaseYear: purchaseMeta.purchaseYear,
        purchaseDate: purchaseMeta.purchaseDate,
        purchaseChannel: getText("购入渠道", "购买渠道", "渠道") || undefined,
        favoriteScore: getInteger("喜爱指数"),
      };
    }
    case "包清单": {
      const purchaseMeta = getPurchaseMeta();
      const category = getText("品类");
      const type = getText("类型", "类别");
      const subcategory = getText("款式", "小类");
      if (!category && !subcategory) return null;

      return {
        itemType: "bag",
        brand: getText("品牌") || undefined,
        category: type || category || "包",
        subcategory: subcategory || undefined,
        color: getText("颜色") || undefined,
        size: getText("尺寸") || undefined,
        material: getText("面料", "材质") || undefined,
        designElements: getText("设计元素") || undefined,
        season: getList("季节"),
        scenario: getText("场景") || undefined,
        price: getNumber("价格"),
        priceRange: getText("价格段") || undefined,
        useDays: getInteger("使用天数"),
        costPerWear: getNumber("单次价格"),
        purchaseYear: purchaseMeta.purchaseYear,
        purchaseDate: purchaseMeta.purchaseDate,
        purchaseChannel: getText("购买渠道", "购入渠道", "渠道") || undefined,
        favoriteScore: getInteger("喜爱指数"),
      };
    }
    case "鞋类清单": {
      const purchaseMeta = getPurchaseMeta();
      const category = getText("品类");
      const type = getText("类型", "类别");
      const subcategory = getText("款式", "小类");
      if (!category && !subcategory) return null;

      return {
        itemType: "shoes",
        brand: getText("品牌") || undefined,
        category: type || category || "鞋",
        subcategory: subcategory || undefined,
        color: getText("颜色") || undefined,
        designElements: getText("设计元素") || undefined,
        scenario: getText("场景") || undefined,
        season: getList("季节"),
        price: getNumber("价格"),
        priceRange: getText("价格段") || undefined,
        wearDays: getInteger("穿着天数"),
        costPerWear: getNumber("单次价格"),
        purchaseYear: purchaseMeta.purchaseYear,
        purchaseDate: purchaseMeta.purchaseDate,
        purchaseChannel: getText("购买渠道", "购入渠道", "渠道") || undefined,
        favoriteScore: getInteger("喜爱指数"),
      };
    }
    case "贵重首饰清单": {
      const purchaseMeta = getPurchaseMeta();
      const category = getText("品类");
      const type = getText("类型", "类别");
      const subcategory = getText("款式", "小类");
      if (!category && !subcategory) return null;

      return {
        itemType: "jewelry",
        brand: getText("品牌") || undefined,
        category: type || category || "首饰",
        subcategory: subcategory || undefined,
        color: getText("色系", "颜色") || undefined,
        designElements: getText("设计元素") || undefined,
        price: getNumber("价格"),
        priceRange: getText("价格段") || undefined,
        useDays: getInteger("佩戴天数", "使用天数"),
        costPerWear: getNumber("单次价格"),
        purchaseYear: purchaseMeta.purchaseYear,
        purchaseDate: purchaseMeta.purchaseDate,
        purchaseChannel: getText("渠道", "购买渠道", "购入渠道") || undefined,
        favoriteScore: getInteger("喜爱指数"),
      };
    }
  }
}

function resolveImageMatch(row: SheetRow, images: ImageArchiveEntry[]) {
  if (images.length === 0) return null;

  for (const key of imageFieldKeys) {
    const value = normalizeText(row[key]).toLowerCase();
    if (!value) continue;

    const direct = images.find((image) => image.normalizedName === value);
    if (direct) return direct;

    const base = path.basename(value, path.extname(value)).toLowerCase();
    const byBase = images.find((image) => image.baseName === base);
    if (byBase) return byBase;
  }

  for (const key of identifierKeys) {
    const value = normalizeText(row[key]).toLowerCase();
    if (!value) continue;
    const byBase = images.find((image) => image.baseName === value);
    if (byBase) return byBase;
  }

  return null;
}

async function persistImage(entry: ImageArchiveEntry) {
  await mkdir(uploadsDir, { recursive: true });
  const fileName = `${crypto.randomUUID()}${entry.extension}`;
  const targetPath = path.join(uploadsDir, fileName);
  await writeFile(targetPath, entry.buffer);
  return `/uploads/wardrobe/${fileName}`;
}

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");
  const imagesZip = formData.get("imagesZip");
  const action = normalizeText(formData.get("action") ?? "parse");

  if (!(file instanceof File)) {
    return badRequest("Missing Excel file");
  }

  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    return badRequest("Only .xlsx or .xls files are supported");
  }

  const imageArchiveFile = imagesZip instanceof File && imagesZip.size > 0 ? imagesZip : null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { fileSheets, totalRows } = readWorkbook(buffer);

  let imageEntries: ImageArchiveEntry[] = [];
  try {
    imageEntries = await readImageArchive(imageArchiveFile);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid image archive");
  }

  if (action === "parse") {
    const matchedImageCount = fileSheets.reduce((sum, sheet) => {
      return (
        sum +
        sheet.rows.filter((row) => resolveImageMatch(row, imageEntries) !== null).length
      );
    }, 0);

    return ok({
      jobId: crypto.randomUUID(),
      fileName: file.name,
      imageArchiveName: imageArchiveFile?.name ?? null,
      status: "parsed",
      totalRows,
      imageCount: imageEntries.length,
      matchedImageCount,
      sheets: fileSheets.map(({ rows, ...sheet }) => sheet),
    });
  }

  if (action === "import") {
    const items: CreateWardrobeItemDto[] = [];
    let matchedImageCount = 0;

    for (const sheet of fileSheets) {
      for (const row of sheet.rows) {
        const item = mapRowToItem(sheet.sheetName, row);
        if (!item) continue;

        const imageMatch = resolveImageMatch(row, imageEntries);
        if (imageMatch) {
          item.imageUrl = await persistImage(imageMatch);
          matchedImageCount += 1;
        }

        items.push(item);
      }
    }

    const result = await wardrobeService.bulkImportItems({
      userId: user.id,
      inputs: items,
    });

    return ok({
      fileName: file.name,
      imageArchiveName: imageArchiveFile?.name ?? null,
      status: "imported",
      totalRows,
      parsedRows: items.length,
      importedCount: result.importedCount,
      imageCount: imageEntries.length,
      matchedImageCount,
      sheets: fileSheets.map(({ rows, ...sheet }) => sheet),
    });
  }

  return badRequest("Unsupported import action");
}
