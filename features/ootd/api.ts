import { getSessionUser } from "@/lib/auth/session";
import { ootdService } from "@/server/services/ootd.service";
import type { Locale } from "@/features/i18n/routing";
import type { OotdRecord } from "@/types/ootd";

function buildSampleRecords(locale: Locale): OotdRecord[] {
  return [
    {
      id: "33333333-3333-3333-3333-333333333333",
      wearDate: "2026-03-01",
      scenario: locale === "zh-CN" ? "上班" : "Work",
      itemIds: ["11111111-1111-1111-1111-111111111111"],
      itemTitles: [locale === "zh-CN" ? "黑色羊毛大衣" : "Black Wool Coat"],
      items: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: locale === "zh-CN" ? "黑色羊毛大衣" : "Black Wool Coat",
          itemType: "clothing",
          category: locale === "zh-CN" ? "服饰" : "Clothing",
          subcategory: locale === "zh-CN" ? "大衣" : "Coat",
          brand: "COS",
          color: locale === "zh-CN" ? "黑色" : "Black",
          season: locale === "zh-CN" ? ["秋季", "冬季"] : ["Autumn", "Winter"],
          tags: locale === "zh-CN" ? ["通勤"] : ["Commute"],
        },
      ],
    },
  ];
}

export async function getOotdRecords(locale: Locale) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { data: buildSampleRecords(locale) };
    }

    const records = await ootdService.listRecords({ userId: user.id });
    if (records.length === 0) {
      return { data: buildSampleRecords(locale) };
    }

    return { data: records };
  } catch {
    return { data: buildSampleRecords(locale) };
  }
}
