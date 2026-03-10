"use client";

import { useState } from "react";
import { FilePickerField } from "@/components/shared/file-picker-field";

export function ImageUploader({ emptyText }: { emptyText: string }) {
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <div className="space-y-3 rounded-[28px] border border-dashed border-[hsl(var(--border))] p-5">
      <FilePickerField
        accept="image/*"
        buttonLabel={emptyText}
        fileName={fileNames.length > 0 ? fileNames.join(", ") : null}
        emptyLabel={emptyText}
        onChange={(file) => setFileNames(file ? [file.name] : [])}
      />
    </div>
  );
}
