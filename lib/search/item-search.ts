import type { WardrobeItem } from "@/types/item";

const CJK_TOKEN_RE = /[\u4e00-\u9fff]+/g;
const LATIN_TOKEN_RE = /[a-z0-9]+/gi;

type SearchField =
  | "generic"
  | "name"
  | "brand"
  | "itemType"
  | "category"
  | "subcategory"
  | "color"
  | "designElements"
  | "material"
  | "sleeveType"
  | "collarType"
  | "fit"
  | "silhouette"
  | "style"
  | "season"
  | "scenario"
  | "size"
  | "tags"
  | "priceRange"
  | "purchaseChannel"
  | "notes"
  | "numeric";

type SearchEntry = {
  field: SearchField;
  value?: string;
};

type AliasGroup = {
  fields: SearchField[];
  aliases: string[];
};

const SEARCH_ALIAS_GROUPS: AliasGroup[] = [
  { fields: ["season"], aliases: ["春", "春天", "春季", "春夏", "春秋", "spring"] },
  { fields: ["season"], aliases: ["夏", "夏天", "夏季", "春夏", "夏秋", "summer"] },
  { fields: ["season"], aliases: ["秋", "秋天", "秋季", "春秋", "秋冬", "autumn", "fall"] },
  { fields: ["season"], aliases: ["冬", "冬天", "冬季", "秋冬", "winter"] },
  { fields: ["season"], aliases: ["四季", "all season", "全年"] },
  { fields: ["color"], aliases: ["白", "白色", "米白", "奶白", "象牙白", "cream", "ivory", "off white"] },
  { fields: ["color"], aliases: ["黑", "黑色", "炭黑", "乌黑", "black"] },
  { fields: ["color"], aliases: ["灰", "灰色", "浅灰", "深灰", "炭灰", "grey", "gray"] },
  { fields: ["color"], aliases: ["蓝", "蓝色", "深蓝", "浅蓝", "藏蓝", "牛仔蓝", "navy", "blue", "denim blue"] },
  { fields: ["color"], aliases: ["红", "红色", "酒红", "暗红", "勃艮第", "burgundy", "red"] },
  { fields: ["color"], aliases: ["粉", "粉色", "裸粉", "豆沙粉", "pink", "blush"] },
  { fields: ["color"], aliases: ["绿", "绿色", "军绿", "橄榄绿", "green", "olive"] },
  { fields: ["color"], aliases: ["棕", "棕色", "咖色", "卡其", "驼色", "brown", "camel", "khaki", "beige"] },
  { fields: ["color"], aliases: ["紫", "紫色", "香芋紫", "lavender", "purple"] },
  { fields: ["color"], aliases: ["金", "金色", "香槟金", "gold", "champagne gold"] },
  { fields: ["color"], aliases: ["银", "银色", "silver"] },
  { fields: ["style"], aliases: ["通勤", "通勤风", "office", "workwear"] },
  { fields: ["style"], aliases: ["极简", "极简风", "minimal", "minimalism"] },
  { fields: ["style"], aliases: ["复古", "复古风", "vintage", "retro"] },
  { fields: ["style"], aliases: ["甜酷", "甜酷风"] },
  { fields: ["style"], aliases: ["休闲", "休闲风", "casual"] },
  { fields: ["style"], aliases: ["正式", "正式感", "formal"] },
  { fields: ["style"], aliases: ["约会", "约会风", "date night"] },
  { fields: ["scenario"], aliases: ["旅行", "出游", "travel"] },
  { fields: ["scenario"], aliases: ["度假", "vacation", "resort"] },
  { fields: ["scenario"], aliases: ["宴会", "聚会", "party", "evening"] },
  { fields: ["scenario"], aliases: ["通勤", "上班", "office"] },
  { fields: ["itemType", "category", "subcategory"], aliases: ["上衣", "上装", "tops", "top"] },
  { fields: ["itemType", "category", "subcategory"], aliases: ["下装", "下衣", "bottoms", "bottom"] },
  { fields: ["itemType", "category", "subcategory"], aliases: ["外套", "外衣", "coat", "outerwear"] },
  { fields: ["itemType", "category", "subcategory"], aliases: ["连衣裙", "裙装", "dress", "dresses"] },
  { fields: ["itemType", "category", "subcategory"], aliases: ["半裙", "裙子", "skirt", "skirts"] },
  { fields: ["material"], aliases: ["羊毛", "羊绒", "wool", "cashmere"] },
  { fields: ["material"], aliases: ["棉", "纯棉", "棉质", "cotton"] },
  { fields: ["material"], aliases: ["牛仔", "denim"] },
  { fields: ["material"], aliases: ["丝", "真丝", "缎面", "silk", "satin"] },
  { fields: ["material"], aliases: ["皮", "皮革", "真皮", "皮质", "leather"] },
  { fields: ["material"], aliases: ["针织", "knit", "knitted"] },
  { fields: ["material"], aliases: ["亚麻", "linen"] },
  { fields: ["designElements"], aliases: ["涂鸦", "印花", "graphic", "print"] },
  { fields: ["designElements"], aliases: ["条纹", "stripe", "striped"] },
  { fields: ["designElements"], aliases: ["格纹", "格子", "plaid", "check"] },
  { fields: ["designElements"], aliases: ["蕾丝", "lace"] },
  { fields: ["designElements"], aliases: ["铆钉", "stud"] },
];

const ALL_ALIAS_TOKENS = Array.from(
  new Set(SEARCH_ALIAS_GROUPS.flatMap((group) => group.aliases.map(normalize))),
).sort((left, right) => right.length - left.length);

function tokenize(text: string) {
  return [...(text.match(CJK_TOKEN_RE) ?? []), ...(text.match(LATIN_TOKEN_RE) ?? [])];
}

function getCjkFragments(text: string) {
  const fragments = new Set<string>();

  for (const token of text.match(CJK_TOKEN_RE) ?? []) {
    if (token.length < 2) {
      continue;
    }

    const maxLength = Math.min(token.length, 4);
    for (let length = 2; length <= maxLength; length += 1) {
      for (let start = 0; start <= token.length - length; start += 1) {
        fragments.add(token.slice(start, start + length));
      }
    }
  }

  return Array.from(fragments);
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function splitQueryIntoTerms(query: string) {
  const normalized = normalize(query);
  if (!normalized) return [];

  const rawSegments = normalized.split(/[\s,，、/·\-]+/).filter(Boolean);
  const terms: string[] = [];

  for (const segment of rawSegments) {
    let cursor = segment;

    while (cursor) {
      let matchedAlias: string | null = null;
      let matchedIndex = -1;

      for (const alias of ALL_ALIAS_TOKENS) {
        const index = cursor.indexOf(alias);
        if (index === -1) continue;

        if (
          matchedIndex === -1 ||
          index < matchedIndex ||
          (index === matchedIndex && alias.length > (matchedAlias?.length ?? 0))
        ) {
          matchedAlias = alias;
          matchedIndex = index;
        }
      }

      if (!matchedAlias || matchedIndex === -1) {
        terms.push(cursor);
        break;
      }

      if (matchedIndex > 0) {
        terms.push(cursor.slice(0, matchedIndex));
      }

      terms.push(matchedAlias);
      cursor = cursor.slice(matchedIndex + matchedAlias.length);
    }
  }

  return Array.from(new Set(terms.map(normalize).filter(Boolean)));
}

function canSegmentByTokens(input: string, tokens: string[]) {
  const normalizedInput = normalize(input);
  if (!normalizedInput) return false;

  const normalizedTokens = Array.from(
    new Set(tokens.map(normalize).filter((token) => token && token.length <= normalizedInput.length)),
  ).sort((left, right) => right.length - left.length);

  if (normalizedTokens.length === 0) {
    return false;
  }

  const dp = Array.from({ length: normalizedInput.length + 1 }, () => false);
  dp[0] = true;

  for (let index = 0; index < normalizedInput.length; index += 1) {
    if (!dp[index]) continue;

    for (const token of normalizedTokens) {
      if (normalizedInput.startsWith(token, index)) {
        dp[index + token.length] = true;
      }
    }
  }

  return dp[normalizedInput.length];
}

function expandAliasTokens(value: string, field: SearchField) {
  const normalized = normalize(value);
  if (!normalized) return [];

  const tokens = new Set<string>([normalized]);

  for (const group of SEARCH_ALIAS_GROUPS) {
    if (!group.fields.includes(field)) continue;

    const aliases = group.aliases.map(normalize);
    if (aliases.some((alias) => normalized.includes(alias))) {
      for (const alias of aliases) {
        tokens.add(alias);
      }
    }
  }

  if (field === "season" && (normalized.includes("四季") || normalized.includes("all season"))) {
    tokens.add("四季");
    tokens.add("all season");
    tokens.add("春");
    tokens.add("夏");
    tokens.add("秋");
    tokens.add("冬");
  }

  return Array.from(tokens);
}

function expandGlobalAliasTokens(value: string) {
  const normalized = normalize(value);
  if (!normalized) return [];

  const tokens = new Set<string>([normalized]);

  for (const group of SEARCH_ALIAS_GROUPS) {
    const aliases = group.aliases.map(normalize);
    if (aliases.some((alias) => normalized.includes(alias))) {
      for (const alias of aliases) {
        tokens.add(alias);
      }
    }
  }

  return Array.from(tokens);
}

function expandSearchTokens(value: string, field: SearchField = "generic") {
  const normalized = normalize(value);
  if (!normalized) return [];

  const tokens = new Set<string>([normalized]);

  for (const part of tokenize(normalized)) {
    tokens.add(part);
  }

  for (const fragment of getCjkFragments(normalized)) {
    tokens.add(fragment);
  }

  for (const aliasToken of expandAliasTokens(normalized, field)) {
    tokens.add(aliasToken);
  }

  for (const aliasToken of expandGlobalAliasTokens(normalized)) {
    tokens.add(aliasToken);
  }

  return Array.from(tokens).filter(Boolean);
}

export function expandSearchTerms(query: string) {
  const normalized = normalize(query);
  if (!normalized) return [];

  const parts = splitQueryIntoTerms(normalized);
  const searchableParts = parts.length > 0 ? parts : [normalized];
  const terms = new Set<string>();

  for (const part of searchableParts) {
    for (const token of expandSearchTokens(part)) {
      terms.add(token);
    }
    for (const aliasToken of expandGlobalAliasTokens(part)) {
      terms.add(aliasToken);
    }
  }

  return Array.from(terms);
}

export function matchesSearchText(values: Array<string | undefined>, query: string) {
  return matchesSearchEntries(values.map((value) => ({ field: "generic" as const, value })), query);
}

export function matchesSearchEntries(entries: SearchEntry[], query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  const queryParts = splitQueryIntoTerms(normalizedQuery);
  const searchableParts = queryParts.length > 0 ? queryParts : [normalizedQuery];
  const indexedEntries = entries
    .filter((entry): entry is { field: SearchField; value: string } => Boolean(entry.value?.trim()))
    .map((entry) => ({
      field: entry.field,
      tokens: expandSearchTokens(entry.value!, entry.field),
    }));
  const allIndexedTokens = indexedEntries.flatMap((entry) => entry.tokens);

  return searchableParts.every((part) => {
    const queryTokens = expandSearchTokens(part);

    if (
      indexedEntries.some((entry) =>
        queryTokens.some((queryToken) => entry.tokens.includes(queryToken)),
      )
    ) {
      return true;
    }

    return queryTokens.some((queryToken) => canSegmentByTokens(queryToken, allIndexedTokens)) ||
      canSegmentByTokens(part, allIndexedTokens);
  });
}

export function matchesSearchField(field: SearchField, value: string | undefined, query: string) {
  if (!value?.trim()) return false;
  return matchesSearchEntries([{ field, value }], query);
}

export function getWardrobeItemSearchEntries(item: WardrobeItem): SearchEntry[] {
  return [
    { field: "name", value: item.name },
    { field: "brand", value: item.brand },
    { field: "itemType", value: item.itemType },
    { field: "category", value: item.category },
    { field: "subcategory", value: item.subcategory },
    { field: "color", value: item.color },
    { field: "designElements", value: item.designElements },
    { field: "material", value: item.material },
    { field: "sleeveType", value: item.sleeveType },
    { field: "collarType", value: item.collarType },
    { field: "fit", value: item.fit },
    { field: "silhouette", value: item.silhouette },
    { field: "style", value: item.style },
    { field: "scenario", value: item.scenario },
    { field: "size", value: item.size },
    { field: "priceRange", value: item.priceRange },
    { field: "purchaseChannel", value: item.purchaseChannel },
    { field: "notes", value: item.notes },
    { field: "numeric", value: item.price?.toString() },
    { field: "numeric", value: item.wearDays.toString() },
    { field: "numeric", value: item.useDays?.toString() },
    { field: "numeric", value: item.costPerWear.toString() },
    { field: "numeric", value: item.purchaseYear?.toString() },
    { field: "numeric", value: item.ageYears?.toString() },
    { field: "numeric", value: item.favoriteScore?.toString() },
    ...item.season.map((value) => ({ field: "season" as const, value })),
    ...item.tags.map((value) => ({ field: "tags" as const, value })),
  ];
}
