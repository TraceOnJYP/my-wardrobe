"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { GroupedAutocomplete } from "@/components/shared/grouped-autocomplete";

export function WardrobeFilterBar({
  placeholders,
  options,
}: {
  placeholders: { category: string; brand: string; color: string };
  options: { category: string[]; brand: string[]; color: string[] };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const keys = [
    { key: "category", placeholder: placeholders.category, options: options.category },
    { key: "brand", placeholder: placeholders.brand, options: options.brand },
    { key: "color", placeholder: placeholders.color, options: options.color },
  ] as const;
  const [values, setValues] = useState({
    category: searchParams.get("category") ?? "",
    brand: searchParams.get("brand") ?? "",
    color: searchParams.get("color") ?? "",
  });

  useEffect(() => {
    setValues({
      category: searchParams.get("category") ?? "",
      brand: searchParams.get("brand") ?? "",
      color: searchParams.get("color") ?? "",
    });
  }, [searchParams]);

  const applyFilter = (key: (typeof keys)[number]["key"], value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="relative z-20 grid gap-3 overflow-visible sm:grid-cols-3">
      {keys.map(({ key, placeholder, options: fieldOptions }) => {
        return (
          <div key={key} className="relative z-20 overflow-visible">
            <GroupedAutocomplete
              value={values[key]}
              onValueChange={(value) =>
                setValues((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
              onSelect={(value) => {
                setValues((current) => ({
                  ...current,
                  [key]: value,
                }));
                applyFilter(key, value);
              }}
              onCommit={(value) => applyFilter(key, value)}
              placeholder={placeholder}
              emptyLabel={placeholder}
              groups={[
                {
                  label: placeholder,
                  options: fieldOptions.slice(0, 8),
                },
              ]}
            />
          </div>
        );
      })}
    </div>
  );
}
