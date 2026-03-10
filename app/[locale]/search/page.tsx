import { SearchBar } from "@/components/search/search-bar";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";
import { SectionHeader } from "@/components/shared/section-header";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getSearchItems } from "@/features/wardrobe/api";
import type { Locale } from "@/features/i18n/routing";

export default async function SearchPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const items = await getSearchItems(locale);

  return (
    <div className="space-y-6">
      <SectionHeader title={dict.search.title} />
      <SearchBar placeholder={dict.search.placeholder} />
      <SearchFilters text={dict.search.filtersPlaceholder} />
      <SearchResults items={items.data} labels={dict.wardrobe.card} />
    </div>
  );
}
