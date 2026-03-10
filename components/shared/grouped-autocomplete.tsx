"use client";

import { useEffect, useMemo, useState } from "react";
import { matchesSearchText } from "@/lib/search/item-search";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export interface AutocompleteGroup {
  label: string;
  options: string[];
}

const RECENT_SEARCH_LIMIT = 3;

function highlightMatch(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return text;

  const matchIndex = text.toLowerCase().indexOf(normalizedQuery);
  if (matchIndex < 0) return text;

  return (
    <>
      {text.slice(0, matchIndex)}
      <span className="rounded bg-[rgba(214,154,97,0.18)] px-0.5 text-[hsl(var(--foreground))]">
        {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </span>
      {text.slice(matchIndex + normalizedQuery.length)}
    </>
  );
}

export function GroupedAutocomplete({
  value,
  onValueChange,
  onSelect,
  onCommit,
  placeholder,
  emptyLabel,
  groups,
  enterMode = "highlighted",
  historyKey,
  recentLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (value: string) => void;
  onCommit?: (value: string) => void;
  placeholder: string;
  emptyLabel?: string;
  groups: AutocompleteGroup[];
  enterMode?: "highlighted" | "input";
  historyKey?: string;
  recentLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!historyKey) return;

    try {
      const raw = window.localStorage.getItem(historyKey);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, RECENT_SEARCH_LIMIT) : []);
    } catch {
      setRecentSearches([]);
    }
  }, [historyKey]);

  const saveRecentSearch = (nextValue: string) => {
    const normalizedValue = nextValue.trim();
    if (!historyKey || !normalizedValue) return;

    setRecentSearches((current) => {
      const next = [normalizedValue, ...current.filter((item) => item !== normalizedValue)].slice(
        0,
        RECENT_SEARCH_LIMIT,
      );

      try {
        window.localStorage.setItem(historyKey, JSON.stringify(next));
      } catch {
        return current;
      }

      return next;
    });
  };

  const visibleGroups = useMemo(() => {
    const query = value.trim().toLowerCase();
    const filteredGroups = groups
      .map((group) => ({
        ...group,
        options: query
          ? group.options.filter((option) => matchesSearchText([option], query)).slice(0, 6)
          : group.options.slice(0, 6),
      }))
      .filter((group) => group.options.length > 0);

    if (!query && recentSearches.length > 0 && recentLabel) {
      return [{ label: recentLabel, options: recentSearches }, ...filteredGroups];
    }

    return filteredGroups;
  }, [groups, recentLabel, recentSearches, value]);
  const visibleOptions = useMemo(
    () =>
      visibleGroups.flatMap((group) =>
        group.options.map((option) => ({
          group: group.label,
          value: option,
        })),
      ),
    [visibleGroups],
  );

  const applyValue = (nextValue: string) => {
    saveRecentSearch(nextValue);
    onSelect(nextValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative z-40 overflow-visible">
      <Input
        value={value}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          saveRecentSearch(value);
          onCommit?.(value);
          window.setTimeout(() => setIsOpen(false), 120);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && visibleOptions.length > 0) {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((current) =>
              current < 0 ? 0 : (current + 1) % visibleOptions.length,
            );
          }

          if (event.key === "ArrowUp" && visibleOptions.length > 0) {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((current) =>
              current < 0 ? visibleOptions.length - 1 : current === 0 ? visibleOptions.length - 1 : current - 1,
            );
          }

          if (event.key === "Enter" && isOpen) {
            event.preventDefault();
            if (enterMode === "input") {
              saveRecentSearch(value);
              onCommit?.(value);
              setIsOpen(false);
              setHighlightedIndex(-1);
            } else {
              if (highlightedIndex >= 0) {
                applyValue(visibleOptions[highlightedIndex]?.value ?? value);
              } else {
                saveRecentSearch(value);
                onCommit?.(value);
                setIsOpen(false);
              }
            }
          }

          if (event.key === "Enter" && !isOpen) {
            event.preventDefault();
            saveRecentSearch(value);
            onCommit?.(value);
          }

          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
      />

      {isOpen ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-[80] rounded-[22px] border border-white/75 bg-white/95 p-2 shadow-[0_16px_35px_rgba(77,57,36,0.12)] backdrop-blur-xl">
          {visibleGroups.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">{emptyLabel ?? "-"}</div>
          ) : (
            <div className="space-y-2">
              {visibleGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="px-3 pt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                    {group.label}
                  </div>
                  {group.options.map((option) => {
                    const flatIndex = visibleOptions.findIndex(
                      (entry) => entry.group === group.label && entry.value === option,
                    );

                    return (
                      <button
                        key={`${group.label}-${option}`}
                        type="button"
                        onMouseEnter={() => setHighlightedIndex(flatIndex)}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applyValue(option);
                        }}
                        className={cn(
                          "w-full rounded-[16px] px-3 py-2 text-left text-sm transition",
                          highlightedIndex === flatIndex
                            ? "bg-[rgba(255,244,235,0.95)] text-[hsl(var(--foreground))]"
                            : "bg-transparent text-[hsl(var(--muted-foreground))]",
                        )}
                      >
                        {highlightMatch(option, value)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
