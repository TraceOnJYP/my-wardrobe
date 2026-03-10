"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ItemSearchInput } from "@/components/search/item-search-input";
import type { AutocompleteGroup } from "@/components/shared/grouped-autocomplete";
import { Button } from "@/components/ui/button";

export function SearchBar({
  placeholder,
  actionLabel,
  emptyLabel,
  groups,
  recentLabel,
}: {
  placeholder: string;
  actionLabel: string;
  emptyLabel: string;
  groups: AutocompleteGroup[];
  recentLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const buildUrl = (nextParams: URLSearchParams) => {
    const query = nextParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const applyValue = (nextValue: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextValue.trim()) next.set("q", nextValue.trim());
    else next.delete("q");
    router.push(buildUrl(next));
    router.refresh();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyValue(value);
  };

  return (
    <form className="relative z-30 flex gap-3 overflow-visible" onSubmit={onSubmit}>
      <div className="flex-1">
        <ItemSearchInput
          value={value}
          onValueChange={setValue}
          onSelect={(nextValue) => {
            setValue(nextValue);
            applyValue(nextValue);
          }}
          onCommit={applyValue}
          placeholder={placeholder}
          emptyLabel={emptyLabel}
          groups={groups}
          enterMode="input"
          historyKey="smart-wardrobe:search-history:wardrobe"
          recentLabel={recentLabel}
        />
      </div>
      <Button
        type="submit"
        className="rounded-2xl px-5 py-3 text-sm font-semibold"
      >
        {actionLabel}
      </Button>
    </form>
  );
}
