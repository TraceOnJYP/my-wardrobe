"use client";

import { GroupedAutocomplete, type AutocompleteGroup } from "@/components/shared/grouped-autocomplete";

export function ItemSearchInput({
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
  emptyLabel: string;
  groups: AutocompleteGroup[];
  enterMode?: "highlighted" | "input";
  historyKey?: string;
  recentLabel?: string;
}) {
  return (
    <div className="relative z-30 overflow-visible">
      <GroupedAutocomplete
        value={value}
        onValueChange={onValueChange}
        onSelect={onSelect}
        onCommit={onCommit}
        placeholder={placeholder}
        emptyLabel={emptyLabel}
        groups={groups}
        enterMode={enterMode}
        historyKey={historyKey}
        recentLabel={recentLabel}
      />
    </div>
  );
}
