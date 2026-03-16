import path from "node:path";
import * as XLSX from "xlsx";
import { unauthorized } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { wardrobeService } from "@/server/services/wardrobe.service";
import type { WardrobeItem } from "@/types/item";

const SHEETS = {
  clothing: "服饰清单",
  accessory: "配饰清单",
  bag: "包清单",
  shoes: "鞋类清单",
  jewelry: "贵重首饰清单",
} as const;

function splitPurchaseDate(value?: string) {
  if (!value) {
    return { year: "", month: "", day: "" };
  }

  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}

function imageNameFromUrl(imageUrl?: string) {
  if (!imageUrl) return "";
  try {
    const pathname = imageUrl.startsWith("http") ? new URL(imageUrl).pathname : imageUrl;
    return path.basename(pathname);
  } catch {
    return path.basename(imageUrl);
  }
}

function joinList(values?: string[]) {
  return values && values.length > 0 ? values.join("、") : "";
}

function baseMeta(item: WardrobeItem) {
  const { year, month, day } = splitPurchaseDate(item.purchaseDate);
  return {
    编号: item.clientId || item.id,
    图片名: imageNameFromUrl(item.imageUrl),
    品牌: item.brand ?? "",
    品类: item.itemType === "clothing" ? "服饰" : item.itemType === "accessory" ? "配饰" : item.itemType === "bag" ? "包" : item.itemType === "shoes" ? "鞋" : item.itemType === "jewelry" ? "首饰" : "",
    类型: item.category ?? "",
    款式: item.subcategory ?? "",
    颜色: item.color ?? "",
    设计元素: item.designElements ?? "",
    季节: joinList(item.season),
    价格: item.price ?? "",
    价格段: item.priceRange ?? "",
    单次价格: item.costPerWear ?? "",
    购入年份: item.purchaseYear ?? year,
    购入月份: month,
    购入日期: day,
    购入渠道: item.purchaseChannel ?? "",
    喜爱指数: item.favoriteScore ?? "",
  };
}

function buildClothingRow(item: WardrobeItem) {
  return {
    ...baseMeta(item),
    材质: item.material ?? "",
    袖型: item.sleeveType ?? "",
    领型: item.collarType ?? "",
    宽松度: item.fit ?? "",
    廓形: item.silhouette ?? "",
    风格: item.style ?? "",
    穿着次数: item.manualWearDays ?? 0,
    衣服年龄: item.ageYears ?? "",
    标签: joinList(item.tags),
  };
}

function buildAccessoryRow(item: WardrobeItem) {
  return {
    ...baseMeta(item),
    穿着次数: item.manualWearDays ?? 0,
  };
}

function buildBagRow(item: WardrobeItem) {
  return {
    ...baseMeta(item),
    尺寸: item.size ?? "",
    面料: item.material ?? "",
    场景: item.scenario ?? "",
    使用次数: item.manualUseDays ?? item.useDays ?? 0,
  };
}

function buildShoesRow(item: WardrobeItem) {
  return {
    ...baseMeta(item),
    场景: item.scenario ?? "",
    穿着次数: item.manualWearDays ?? 0,
  };
}

function buildJewelryRow(item: WardrobeItem) {
  return {
    ...baseMeta(item),
    色系: item.color ?? "",
    佩戴次数: item.manualUseDays ?? item.useDays ?? 0,
  };
}

export async function GET() {
  const user = await requireSessionUser();
  if (!user) return unauthorized();

  const items = await wardrobeService.listItems({ userId: user.id });
  const workbook = XLSX.utils.book_new();

  const clothingRows = items.filter((item) => item.itemType === "clothing").map(buildClothingRow);
  const accessoryRows = items.filter((item) => item.itemType === "accessory").map(buildAccessoryRow);
  const bagRows = items.filter((item) => item.itemType === "bag").map(buildBagRow);
  const shoesRows = items.filter((item) => item.itemType === "shoes").map(buildShoesRow);
  const jewelryRows = items.filter((item) => item.itemType === "jewelry").map(buildJewelryRow);

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clothingRows), SHEETS.clothing);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(accessoryRows), SHEETS.accessory);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(bagRows), SHEETS.bag);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(shoesRows), SHEETS.shoes);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(jewelryRows), SHEETS.jewelry);

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const fileName = `smart-wardrobe-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
