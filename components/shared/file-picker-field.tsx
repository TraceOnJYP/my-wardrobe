"use client";

import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";

export function FilePickerField({
  accept,
  buttonLabel,
  fileName,
  emptyLabel,
  helperText,
  onChange,
}: {
  accept?: string;
  buttonLabel: string;
  fileName?: string | null;
  emptyLabel: string;
  helperText?: string;
  onChange: (file: File | null) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <div className="flex min-h-20 items-center gap-3 rounded-[24px] border border-[hsl(var(--border))] bg-white/72 px-4 py-4 shadow-[0_8px_20px_rgba(77,57,36,0.04)]">
        <Button type="button" variant="outline" className="shrink-0" onClick={() => inputRef.current?.click()}>
          {buttonLabel}
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
            {fileName ?? emptyLabel}
          </div>
          {helperText ? (
            <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{helperText}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
