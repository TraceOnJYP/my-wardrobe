"use client";

import { useEffect, useState } from "react";
import {
  addOotdCandidate,
  dispatchOotdCandidateMotion,
  hasOotdCandidate,
  onOotdCandidatesChanged,
  removeOotdCandidate,
} from "@/lib/ootd-candidates";
import type { WardrobeItem } from "@/types/item";

export function AddToCandidatesButton({
  item,
  labels,
  className,
}: {
  item: WardrobeItem;
  labels: {
    add: string;
    added: string;
    remove: string;
  };
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setAdded(hasOotdCandidate(item.id));
    return onOotdCandidatesChanged(() => {
      setAdded(hasOotdCandidate(item.id));
    });
  }, [item.id]);

  const buttonLabel = added ? labels.remove : labels.add;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const motionSource = {
          sourceX: rect.left + rect.width / 2,
          sourceY: rect.top + rect.height / 2,
        };

        if (added) {
          dispatchOotdCandidateMotion({ ...motionSource, mode: "remove" });
          removeOotdCandidate(item.id);
          setAdded(false);
          return;
        }

        dispatchOotdCandidateMotion({ ...motionSource, mode: "add" });
        addOotdCandidate(item);
        setAdded(true);
      }}
      className={
        className ??
        (added
          ? "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-base font-semibold leading-none text-[hsl(var(--primary-foreground))] shadow-[0_10px_20px_rgba(93,57,30,0.18)]"
          : "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(214,154,97,0.34)] bg-[rgba(255,252,248,0.98)] text-base font-semibold leading-none text-[hsl(var(--foreground))] shadow-[0_8px_18px_rgba(77,57,36,0.06)]")
      }
      aria-pressed={added}
      aria-label={buttonLabel}
      title={buttonLabel}
    >
      <span aria-hidden="true">{added ? "-" : "+"}</span>
    </button>
  );
}
