import type { Locale } from "@/features/i18n/routing";

const dictionaries = {
  "zh-CN": () => import("@/messages/zh-CN.json").then((module) => module.default),
  "en-US": () => import("@/messages/en-US.json").then((module) => module.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
