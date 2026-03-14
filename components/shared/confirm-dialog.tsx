"use client";

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isPending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(32,21,12,0.38)] p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-[rgba(255,250,245,0.98)] p-6 shadow-[0_24px_80px_rgba(54,36,20,0.18)]">
        <div className="space-y-2">
          <div className="text-xl font-semibold text-[hsl(var(--foreground))]">{title}</div>
          <div className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
