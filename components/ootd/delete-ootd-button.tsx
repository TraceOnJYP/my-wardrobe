"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteOotdButton({
  recordId,
  redirectHref,
  label,
  pendingLabel,
  variant = "outline",
  className,
  onDeleted,
}: {
  recordId: string;
  redirectHref?: string;
  label: string;
  pendingLabel: string;
  variant?: "outline" | "ghost";
  className?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

      onDeleted?.();

      if (redirectHref) {
        router.push(redirectHref);
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant={variant} className={className} onClick={handleDelete} disabled={isPending}>
        {isPending ? pendingLabel : label}
      </Button>
      {error ? <div className="text-xs text-red-700">{error}</div> : null}
    </div>
  );
}
