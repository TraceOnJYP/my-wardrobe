"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteOotdButton({
  recordId,
  redirectHref,
  label,
  pendingLabel,
  confirmLabel,
  cancelLabel,
  confirmTitle,
  variant = "outline",
  className,
  onDeleted,
}: {
  recordId: string;
  redirectHref?: string;
  label: string;
  pendingLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmTitle: string;
  variant?: "outline" | "ghost";
  className?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/ootd/${recordId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("delete_failed");
        return;
      }

      setOpen(false);
      onDeleted?.();

      if (redirectHref) {
        router.push(redirectHref);
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant={variant} className={className} onClick={() => setOpen(true)} disabled={isPending}>
        {isPending ? pendingLabel : label}
      </Button>
      <ConfirmDialog
        open={open}
        title={confirmTitle}
        description={confirmLabel}
        confirmLabel={label}
        cancelLabel={cancelLabel}
        isPending={isPending}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
      {error ? <div className="text-xs text-red-700">{error}</div> : null}
    </div>
  );
}
