import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { SearchBar } from "@/components/search/search-bar";
import { WardrobeFilterBar } from "@/components/wardrobe/wardrobe-filter-bar";
import { WardrobeGrid } from "@/components/wardrobe/wardrobe-grid";
import { IdleFilterBanner } from "@/components/wardrobe/idle-filter-banner";
import { WardrobeList } from "@/components/wardrobe/wardrobe-list";
import { WardrobeTypeNav } from "@/components/wardrobe/wardrobe-type-nav";
import { WardrobeViewToggle } from "@/components/wardrobe/wardrobe-view-toggle";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getItems } from "@/features/wardrobe/api";
import type { Locale } from "@/features/i18n/routing";
import { getItemDisplayCategory } from "@/lib/item-display";
import type { WardrobeItem } from "@/types/item";

function uniqueSorted(values: Array<string | undefined>, locale: string) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b, locale));
}

function buildSearchGroups(items: WardrobeItem[], locale: string) {
  return [
    {
      label: locale === "zh-CN" ? "单品名称" : "Item name",
      options: uniqueSorted(items.map((item) => item.name), locale),
    },
    {
      label: locale === "zh-CN" ? "品牌" : "Brand",
      options: uniqueSorted(items.map((item) => item.brand), locale),
    },
    {
      label: locale === "zh-CN" ? "类型" : "Type",
      options: uniqueSorted(items.map((item) => getItemDisplayCategory(item)), locale),
    },
    {
      label: locale === "zh-CN" ? "颜色" : "Color",
      options: uniqueSorted(items.map((item) => item.color), locale),
    },
    {
      label: locale === "zh-CN" ? "设计元素" : "Design elements",
      options: uniqueSorted(items.map((item) => item.designElements), locale),
    },
    {
      label: locale === "zh-CN" ? "材质" : "Material",
      options: uniqueSorted(items.map((item) => item.material), locale),
    },
    {
      label: locale === "zh-CN" ? "风格" : "Style",
      options: uniqueSorted(items.map((item) => item.style), locale),
    },
    {
      label: locale === "zh-CN" ? "场景" : "Scenario",
      options: uniqueSorted(items.map((item) => item.scenario), locale),
    },
    {
      label: locale === "zh-CN" ? "季节" : "Season",
      options: uniqueSorted(items.flatMap((item) => item.season), locale),
    },
    {
      label: locale === "zh-CN" ? "标签" : "Tags",
      options: uniqueSorted(items.flatMap((item) => item.tags), locale),
    },
  ].filter((group) => group.options.length > 0);
}

export default async function WardrobePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    view?: "grid" | "list";
    type?: string;
    idle?: string;
    q?: string;
    category?: string;
    brand?: string;
    color?: string;
    sort?: string;
    order?: string;
    gridPage?: string;
  }>;
}) {
  const { locale } = await params;
  const {
    view = "list",
    type = "clothing",
    idle = "",
    q = "",
    category = "",
    brand = "",
    color = "",
    sort = "",
    order = "",
    gridPage = "1",
  } = await searchParams;
  const dict = await getDictionary(locale);
  const [items, searchBaseItems, categoryBaseItems, brandBaseItems, colorBaseItems] = await Promise.all([
    getItems(locale, { q, type, idle, category, brand, color, sort, order }),
    getItems(locale, { type, idle, category, brand, color }),
    getItems(locale, { q, type, idle, brand, color }),
    getItems(locale, { q, type, idle, category, color }),
    getItems(locale, { q, type, idle, category, brand }),
  ]);
  const hasActiveQuery = Boolean(q || category || brand || color || idle || (type && type !== "all"));
  const filterOptions = {
    category: uniqueSorted(categoryBaseItems.data.map((item) => getItemDisplayCategory(item)), locale),
    brand: uniqueSorted(
      brandBaseItems.data.map((item) => item.brand),
      locale,
    ),
    color: uniqueSorted(
      colorBaseItems.data.map((item) => item.color),
      locale,
    ),
  };
  const searchGroups = buildSearchGroups(searchBaseItems.data, locale);
  const typeOptions = [
    { value: "clothing", label: dict.wardrobe.types.clothing },
    { value: "accessory", label: dict.wardrobe.types.accessory },
    { value: "bag", label: dict.wardrobe.types.bag },
    { value: "shoes", label: dict.wardrobe.types.shoes },
    { value: "jewelry", label: dict.wardrobe.types.jewelry },
    { value: "other", label: dict.wardrobe.types.other },
    { value: "all", label: dict.wardrobe.types.all },
    { value: "discarded", label: locale === "zh-CN" ? "已丢弃" : "Discarded" },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <div className="relative z-30 flex min-w-0 flex-col gap-4 overflow-visible rounded-[30px] border border-white/60 bg-white/50 p-5 shadow-[0_12px_30px_rgba(77,57,36,0.06)] backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <SectionHeader title={dict.wardrobe.title} subtitle={dict.wardrobe.subtitle} />
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/wardrobe/new?mode=import`}
              className="rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-medium"
            >
              {dict.wardrobe.actions.importExcel}
            </Link>
            <Link
              href={`/${locale}/wardrobe/new`}
              className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
            >
              {dict.wardrobe.actions.addItem}
            </Link>
          </div>
        </div>
        <SearchBar
          placeholder={dict.search.placeholder}
          actionLabel={dict.search.action}
          emptyLabel={dict.wardrobe.noResults}
          groups={searchGroups}
          recentLabel={dict.search.recent}
        />
        <WardrobeTypeNav
          currentType={type}
          options={typeOptions}
        />
        {idle === "year" ? (
          <IdleFilterBanner locale={locale} />
        ) : null}
        <div className="relative z-20 flex items-center justify-between gap-4 overflow-visible">
          <WardrobeFilterBar placeholders={dict.wardrobe.filters} options={filterOptions} />
          <WardrobeViewToggle initialView={view} labels={dict.wardrobe.view} />
        </div>
      </div>
      {items.data.length === 0 ? (
        <EmptyState title={hasActiveQuery ? dict.wardrobe.noResults : dict.wardrobe.empty} />
      ) : view === "list" ? (
        <WardrobeList
          items={items.data}
          labels={dict.wardrobe.list}
          locale={locale}
          sort={sort}
          order={order}
          query={q}
        />
      ) : (
        <WardrobeGrid
          items={items.data}
          labels={{ ...dict.wardrobe.card, ...dict.wardrobe.list }}
          locale={locale}
          query={q}
          currentPage={Number(gridPage) || 1}
        />
      )}
    </div>
  );
}
