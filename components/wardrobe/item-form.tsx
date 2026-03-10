"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { WardrobeItem } from "@/types/item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilePickerField } from "@/components/shared/file-picker-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

type CategoryKey = "clothing" | "accessory" | "bag" | "shoes" | "jewelry";

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface FormDictionary {
  categories: Record<CategoryKey, string>;
  common: {
    tabsLabel: string;
    basicInfo: string;
    styleInfo: string;
    usageInfo: string;
    extraInfo: string;
    imagePanel: string;
    imageHint: string;
    imageCta: string;
    imageEmpty: string;
    notes: string;
    save: string;
    draft: string;
    saving: string;
    saveSuccess: string;
    saveError: string;
    required: string;
    customOption: string;
    customPlaceholder: string;
    manualWearHint: string;
  };
  fields: Record<CategoryKey, string[]>;
  placeholders: Record<string, string>;
  options: {
    subcategory: Record<CategoryKey, string[]>;
    color: string[];
    material: string[];
    category: Record<CategoryKey, string[]>;
    size: string[];
  };
}

const categoryFieldGroups: Record<
  CategoryKey,
  Array<{ titleKey: keyof FormDictionary["common"]; fields: string[] }>
> = {
  clothing: [
    { titleKey: "basicInfo", fields: ["brand", "subcategory", "color", "material"] },
    { titleKey: "styleInfo", fields: ["designElements", "sleeveType", "collarType", "fit", "silhouette", "style", "season", "tags"] },
    { titleKey: "usageInfo", fields: ["price", "priceRange", "wearDays", "costPerWear"] },
    { titleKey: "extraInfo", fields: ["purchaseYear", "purchaseChannel", "ageYears", "favoriteScore"] },
  ],
  accessory: [
    { titleKey: "basicInfo", fields: ["brand", "category", "subcategory", "color"] },
    { titleKey: "styleInfo", fields: ["designElements", "season"] },
    { titleKey: "usageInfo", fields: ["price", "priceRange", "wearDays", "costPerWear"] },
    { titleKey: "extraInfo", fields: ["purchaseYear", "purchaseChannel", "favoriteScore"] },
  ],
  bag: [
    { titleKey: "basicInfo", fields: ["brand", "subcategory", "color", "size", "material"] },
    { titleKey: "styleInfo", fields: ["designElements", "season", "scenario"] },
    { titleKey: "usageInfo", fields: ["price", "priceRange", "useDays", "costPerWear"] },
    { titleKey: "extraInfo", fields: ["purchaseDate", "purchaseChannel", "favoriteScore"] },
  ],
  shoes: [
    { titleKey: "basicInfo", fields: ["brand", "subcategory", "color"] },
    { titleKey: "styleInfo", fields: ["designElements", "scenario", "season"] },
    { titleKey: "usageInfo", fields: ["price", "priceRange", "wearDays", "costPerWear"] },
    { titleKey: "extraInfo", fields: ["purchaseDate", "purchaseChannel", "favoriteScore"] },
  ],
  jewelry: [
    { titleKey: "basicInfo", fields: ["brand", "subcategory", "color"] },
    { titleKey: "styleInfo", fields: ["designElements"] },
    { titleKey: "usageInfo", fields: ["price", "priceRange", "wearDays", "costPerWear"] },
    { titleKey: "extraInfo", fields: ["purchaseYear", "purchaseChannel", "favoriteScore"] },
  ],
};

const fieldTypeMap: Record<string, "text" | "number" | "date" | "textarea"> = {
  price: "number",
  priceRange: "text",
  wearDays: "number",
  useDays: "number",
  costPerWear: "number",
  purchaseYear: "number",
  ageYears: "number",
  favoriteScore: "number",
  purchaseDate: "date",
  designElements: "textarea",
  tags: "textarea",
  notes: "textarea",
};

export function ItemForm({
  dict,
  initialItem,
  itemId,
  onSaved,
}: {
  dict: FormDictionary;
  initialItem?: WardrobeItem;
  itemId?: string;
  onSaved?: (item: WardrobeItem) => void;
}) {
  const initialCategory = (initialItem?.itemType as CategoryKey | undefined) ?? "clothing";
  const defaultPurchaseDate = getTodayDateInputValue();
  const defaultPurchaseYear = String(new Date(defaultPurchaseDate).getFullYear());
  const [category, setCategory] = useState<CategoryKey>(initialCategory);
  const [values, setValues] = useState<Record<string, string>>({
    brand: initialItem?.brand ?? "",
    category:
      initialItem?.category ??
      dict.options.category[initialCategory][0] ??
      dict.categories[initialCategory],
    subcategory: initialItem?.subcategory ?? dict.options.subcategory[initialCategory][0] ?? "",
    color: initialItem?.color ?? dict.options.color[0] ?? "",
    material: initialItem?.material ?? dict.options.material[0] ?? "",
    size: initialItem?.size ?? dict.options.size[0] ?? "",
    designElements: initialItem?.designElements ?? "",
    sleeveType: initialItem?.sleeveType ?? "",
    collarType: initialItem?.collarType ?? "",
    fit: initialItem?.fit ?? "",
    silhouette: initialItem?.silhouette ?? "",
    style: initialItem?.style ?? "",
    season: initialItem?.season?.join(", ") ?? "",
    scenario: initialItem?.scenario ?? "",
    tags: initialItem?.tags?.join(", ") ?? "",
    price: initialItem?.price?.toString() ?? "",
    priceRange: initialItem?.priceRange ?? "",
    wearDays: (initialItem?.manualWearDays ?? initialItem?.wearDays)?.toString() ?? "",
    useDays: (initialItem?.manualUseDays ?? initialItem?.useDays)?.toString() ?? "",
    costPerWear: initialItem?.costPerWear?.toString() ?? "",
    purchaseYear: initialItem?.purchaseYear?.toString() ?? defaultPurchaseYear,
    purchaseDate: initialItem?.purchaseDate?.slice(0, 10) ?? defaultPurchaseDate,
    purchaseChannel: initialItem?.purchaseChannel ?? "",
    ageYears: initialItem?.ageYears?.toString() ?? "",
    favoriteScore: initialItem?.favoriteScore?.toString() ?? "",
    notes: initialItem?.notes ?? "",
  });
  const [customFields, setCustomFields] = useState<Record<string, boolean>>({});
  const [imageName, setImageName] = useState<string | null>(
    initialItem?.imageUrl ? initialItem.imageUrl.split("/").pop() ?? null : null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(initialItem?.imageUrl ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const groups = categoryFieldGroups[category];
  const requiredFields = new Set(groups[0].fields);

  const setValue = (field: string, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      return { ...current, [field]: false };
    });
  };

  const setCustomField = (field: string, enabled: boolean) => {
    setCustomFields((current) => ({ ...current, [field]: enabled }));
    if (!enabled) return;
    setValues((current) => ({ ...current, [field]: "" }));
  };

  const setDefaultsForCategory = (nextCategory: CategoryKey) => {
    setCategory(nextCategory);
    setFieldErrors({});
    setSubmitError(null);
    setValues((current) => ({
      ...current,
      category: dict.options.category[nextCategory][0] ?? dict.categories[nextCategory],
      subcategory: dict.options.subcategory[nextCategory][0] ?? "",
      color: dict.options.color[0] ?? "",
      material:
        nextCategory === "clothing" || nextCategory === "bag"
          ? dict.options.material[0] ?? ""
          : "",
      size: nextCategory === "bag" ? dict.options.size[0] ?? "" : "",
      purchaseYear: current.purchaseYear || defaultPurchaseYear,
      purchaseDate: current.purchaseDate || defaultPurchaseDate,
    }));
  };

  const buildPayload = (imageUrl?: string) => {
    const splitList = (value?: string) =>
      value
        ? value
            .split(/[，,、]/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const toNumber = (value?: string) => {
      if (!value) return undefined;
      const next = Number(value);
      return Number.isNaN(next) ? undefined : next;
    };

    return {
      itemType: category,
      brand: values.brand || undefined,
      category: values.category || dict.categories[category],
      subcategory: values.subcategory || undefined,
      color: values.color || undefined,
      designElements: values.designElements || undefined,
      material: values.material || undefined,
      sleeveType: values.sleeveType || undefined,
      collarType: values.collarType || undefined,
      fit: values.fit || undefined,
      silhouette: values.silhouette || undefined,
      style: values.style || undefined,
      season: splitList(values.season),
      scenario: values.scenario || undefined,
      size: values.size || undefined,
      tags: splitList(values.tags),
      price: toNumber(values.price),
      priceRange: values.priceRange || undefined,
      wearDays: toNumber(values.wearDays),
      useDays: toNumber(values.useDays),
      costPerWear: toNumber(values.costPerWear),
      purchaseYear: toNumber(values.purchaseYear),
      purchaseDate: values.purchaseDate || undefined,
      purchaseChannel: values.purchaseChannel || undefined,
      ageYears: toNumber(values.ageYears),
      favoriteScore: toNumber(values.favoriteScore),
      notes: values.notes || undefined,
      imageUrl: imageUrl ?? initialItem?.imageUrl ?? undefined,
    };
  };

  const renderField = (field: string) => {
    const label = dict.placeholders[field] ?? field;
    const type = fieldTypeMap[field] ?? "text";
    const required = requiredFields.has(field);
    const hasError = fieldErrors[field] ?? false;
    const options =
      field === "subcategory"
        ? dict.options.subcategory[category]
        : field === "color"
          ? dict.options.color
          : field === "material"
            ? dict.options.material
            : field === "category"
              ? dict.options.category[category]
              : field === "size"
                ? dict.options.size
                : null;
    const isCustom = customFields[field] ?? false;
    const showManualWearHint = field === "wearDays" || field === "useDays";

    return (
      <label key={field} className="space-y-2">
        <div className={cn("text-sm font-medium", hasError && "text-[#c25151]")}>
          {label}
          {required ? <span className={cn("ml-1 text-[hsl(var(--primary))]", hasError && "text-[#c25151]")}>*</span> : null}
        </div>
        {options ? (
          <div className="space-y-2">
            <Select
              className={cn(
                hasError &&
                  "border-[#e3aaaa] bg-[#fff4f3] text-[hsl(var(--foreground))] focus-visible:border-[#d76d6d] focus-visible:ring-[#d76d6d]/20",
              )}
              value={isCustom ? "__custom__" : values[field] ?? options[0] ?? ""}
              onChange={(event) => {
                if (event.target.value === "__custom__") {
                  setCustomField(field, true);
                  return;
                }
                setCustomField(field, false);
                setValue(field, event.target.value);
              }}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="__custom__">{dict.common.customOption}</option>
            </Select>
            {isCustom ? (
              <Input
                className={cn(
                  hasError &&
                    "border-[#e3aaaa] bg-[#fff4f3] focus-visible:border-[#d76d6d] focus-visible:ring-[#d76d6d]/20",
                )}
                placeholder={`${dict.common.customPlaceholder}${label}`}
                value={values[field] ?? ""}
                onChange={(event) => setValue(field, event.target.value)}
              />
            ) : null}
          </div>
        ) : type === "textarea" ? (
          <Textarea
            className={cn(
              hasError &&
                "border-[#e3aaaa] bg-[#fff4f3] focus-visible:border-[#d76d6d] focus-visible:ring-[#d76d6d]/20",
            )}
            placeholder={label}
            value={values[field] ?? ""}
            onChange={(event) => setValue(field, event.target.value)}
          />
        ) : (
          <Input
            className={cn(
              hasError &&
                "border-[#e3aaaa] bg-[#fff4f3] focus-visible:border-[#d76d6d] focus-visible:ring-[#d76d6d]/20",
            )}
            type={type}
            placeholder={label}
            value={values[field] ?? ""}
            onChange={(event) => setValue(field, event.target.value)}
          />
        )}
        {showManualWearHint ? (
          <div className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">
            {dict.common.manualWearHint}
          </div>
        ) : null}
      </label>
    );
  };

  const onSubmit = () => {
    startTransition(async () => {
      const nextFieldErrors = Object.fromEntries(
        Array.from(requiredFields).map((field) => [field, !(values[field] ?? "").trim()]),
      );
      const missingFields = Object.entries(nextFieldErrors)
        .filter(([, hasError]) => hasError)
        .map(([field]) => dict.placeholders[field] ?? field);

      if (missingFields.length > 0) {
        setFieldErrors(nextFieldErrors);
        setSubmitError(`${dict.common.saveError} ${missingFields.map((field) => `请填写${field}`).join(" · ")}`);
        return;
      }

      setFieldErrors({});
      setSubmitError(null);
      let nextImageUrl = initialItem?.imageUrl;

      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/uploads/wardrobe-image", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          setSubmitError(dict.common.saveError);
          return;
        }

        const uploadPayload = await uploadResponse.json();
        nextImageUrl = uploadPayload?.data?.url;
      }

      const response = await fetch(itemId ? `/api/items/${itemId}` : "/api/items", {
        method: itemId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload(nextImageUrl)),
      });

      if (!response.ok) {
        setSubmitError(dict.common.saveError);
        return;
      }

      const payload = await response.json();
      const savedId = payload?.data?.id;
      const savedItem = payload?.data as WardrobeItem | undefined;
      const localePrefix = pathname.split("/")[1] || "zh-CN";

      if (!itemId && savedId) {
        router.push(`/${localePrefix}/wardrobe/${savedId}`);
        return;
      }

      if (itemId && savedItem && onSaved) {
        onSaved(savedItem);
        return;
      }

      router.refresh();
    });
  };

  const onPickImage = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setImageName(file.name);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{dict.common.tabsLabel}</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {dict.fields[category].join(" / ")}
              </div>
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">{dict.common.required}</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {(Object.keys(dict.categories) as CategoryKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDefaultsForCategory(key)}
                className={cn(
                  "rounded-2xl px-3 py-3 text-sm font-medium transition",
                  category === key
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_24px_rgba(77,57,36,0.16)]"
                    : "border border-[hsl(var(--border))] bg-white/70 text-[hsl(var(--muted-foreground))]",
                )}
              >
                {dict.categories[key]}
              </button>
            ))}
          </div>
        </Card>

        {groups.map((group) => (
          <Card key={group.titleKey} className="space-y-4 p-6">
            <div className="text-lg font-semibold">{dict.common[group.titleKey]}</div>
            <div className="grid gap-4 md:grid-cols-2">{group.fields.map(renderField)}</div>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Card className="space-y-4 p-6">
          <div className="text-lg font-semibold">{dict.common.imagePanel}</div>
          <div className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{dict.common.imageHint}</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onPickImage(event.target.files?.[0] ?? null)}
          />
          <FilePickerField
            accept="image/*"
            buttonLabel={dict.common.imageCta}
            fileName={imageName}
            emptyLabel={dict.common.imageEmpty}
            helperText={dict.common.imageHint}
            onChange={(file) => {
              onPickImage(file);
              if (fileInputRef.current) {
                const transfer = new DataTransfer();
                if (file) {
                  transfer.items.add(file);
                }
                fileInputRef.current.files = transfer.files;
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-[26px] border border-dashed border-[hsl(var(--border))] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(245,238,229,0.9))] p-5 text-left transition hover:border-[hsl(var(--primary))]"
          >
            {imagePreview ? (
              <div
                className="aspect-[4/5] rounded-[22px] bg-cover bg-center"
                style={{ backgroundImage: `url(${imagePreview})` }}
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[22px] bg-[linear-gradient(160deg,#ead6c1,#f8f4ee)] text-sm text-[hsl(var(--muted-foreground))]">
                {dict.common.imageEmpty}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm font-medium">{imageName ?? dict.common.imageCta}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{dict.common.imageCta}</div>
            </div>
          </button>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="text-lg font-semibold">{dict.common.notes}</div>
          <Textarea
            placeholder={dict.common.notes}
            value={values.notes ?? ""}
            onChange={(event) => setValue("notes", event.target.value)}
          />
          {submitError ? (
            <div className="rounded-2xl border border-[#e3aaaa] bg-[#fff4f3] px-4 py-3 text-sm font-medium text-[#c25151]">
              {submitError}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline">
              {dict.common.draft}
            </Button>
            <Button type="button" onClick={onSubmit}>
              {isPending ? dict.common.saving : dict.common.save}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
