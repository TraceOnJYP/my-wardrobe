"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilePickerField } from "@/components/shared/file-picker-field";

interface SheetPreview {
  sheetName: string;
  headers: string[];
  rowCount: number;
  previewRows: Array<Record<string, string>>;
}

interface ImportResult {
  fileName: string;
  sheets: SheetPreview[];
  totalRows: number;
  importedCount?: number;
  status?: "parsed" | "imported";
  imageArchiveName?: string | null;
  imageCount?: number;
  matchedImageCount?: number;
}

function normalizeHeaderLabel(header: string, aliases: Record<string, string>) {
  return aliases[header] ?? header;
}

export function ExcelImportPanel({
  locale,
  labels,
}: {
  locale: string;
  labels: {
    chooseFile: string;
    chooseImagesZip: string;
    upload: string;
    parsing: string;
    import: string;
    importing: string;
    importSuccess: string;
    noFile: string;
    noImagesZip: string;
    previewTitle: string;
    rows: string;
    images: string;
    matchedImages: string;
    unsupported: string;
    headerAliases: Record<string, string>;
  };
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [imagesZip, setImagesZip] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runRequest = (action: "parse" | "import") => {
    if (!file) {
      setError(labels.noFile);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", action);
      if (imagesZip) {
        formData.append("imagesZip", imagesZip);
      }

      const response = await fetch("/api/excel-import", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? labels.unsupported);
        setResult(null);
        setSuccess(null);
        return;
      }

      setError(null);
      setResult(payload.data);

      if (action === "import") {
        setSuccess(`${labels.importSuccess} ${payload.data.importedCount ?? 0}`);
        router.push(`/${locale}/wardrobe`);
        router.refresh();
        return;
      }

      setSuccess(null);
    });
  };

  return (
    <div className="space-y-4">
      <FilePickerField
        accept=".xlsx,.xls"
        buttonLabel={labels.chooseFile}
        fileName={file?.name}
        emptyLabel={labels.noFile}
        onChange={setFile}
      />
      <FilePickerField
        accept=".zip"
        buttonLabel={labels.chooseImagesZip}
        fileName={imagesZip?.name}
        emptyLabel={labels.noImagesZip}
        onChange={setImagesZip}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => runRequest("parse")} disabled={isPending}>
          {isPending ? labels.parsing : labels.upload}
        </Button>
        {result ? (
          <Button type="button" onClick={() => runRequest("import")} disabled={isPending}>
            {isPending ? labels.importing : labels.import}
          </Button>
        ) : null}
      </div>
      {error ? <Card className="text-sm text-red-700">{error}</Card> : null}
      {success ? <Card className="text-sm text-emerald-700">{success}</Card> : null}
      {result ? (
        <div className="space-y-4">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            {result.fileName} · {result.totalRows} {labels.rows}
          </div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            {result.imageArchiveName ?? labels.noImagesZip} · {result.imageCount ?? 0} {labels.images} ·{" "}
            {result.matchedImageCount ?? 0} {labels.matchedImages}
          </div>
          {result.sheets.map((sheet) => (
            <Card key={sheet.sheetName} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-semibold">{sheet.sheetName}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {sheet.rowCount} {labels.rows}
                </div>
              </div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {labels.previewTitle}:{" "}
                {sheet.headers.map((header) => normalizeHeaderLabel(header, labels.headerAliases)).join(" / ")}
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))]">
                      {sheet.headers.slice(0, 6).map((header) => (
                        <th key={header} className="px-2 py-2 font-medium">
                          {normalizeHeaderLabel(header, labels.headerAliases)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.previewRows.map((row, index) => (
                      <tr key={`${sheet.sheetName}-${index}`} className="border-b border-[hsl(var(--border))]">
                        {sheet.headers.slice(0, 6).map((header) => (
                          <td key={`${sheet.sheetName}-${index}-${header}`} className="px-2 py-2 align-top">
                            {row[header] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
