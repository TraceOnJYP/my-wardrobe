"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

function animateToTarget(source: HTMLElement, targetSelector?: string) {
  if (!targetSelector || typeof document === "undefined") return;

  const target = document.querySelector(targetSelector) as HTMLElement | null;
  if (!target) return;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const ghost = document.createElement("div");

  ghost.textContent = "❤";
  ghost.style.position = "fixed";
  ghost.style.left = `${sourceRect.left + sourceRect.width / 2 - 10}px`;
  ghost.style.top = `${sourceRect.top + sourceRect.height / 2 - 10}px`;
  ghost.style.width = "20px";
  ghost.style.height = "20px";
  ghost.style.display = "flex";
  ghost.style.alignItems = "center";
  ghost.style.justifyContent = "center";
  ghost.style.color = "#dc5a6a";
  ghost.style.fontSize = "16px";
  ghost.style.fontWeight = "700";
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = "300";
  ghost.style.transition = "transform 480ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms ease";
  document.body.appendChild(ghost);

  requestAnimationFrame(() => {
    const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.7)`;
    ghost.style.opacity = "0.15";
  });

  window.setTimeout(() => {
    ghost.remove();
  }, 520);
}

export function FavoriteToggleButton({
  recordId,
  isFavorite,
  activeLabel,
  inactiveLabel,
  className,
  targetSelector,
  onToggled,
}: {
  recordId: string;
  isFavorite: boolean;
  activeLabel: string;
  inactiveLabel: string;
  className?: string;
  targetSelector?: string;
  onToggled?: (next: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const [value, setValue] = useState(isFavorite);

  const toggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    const next = !value;
    setPending(true);

    try {
      const response = await fetch(`/api/ootd/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFavorite: next }),
      });

      if (!response.ok) {
        return;
      }

      setValue(next);
      onToggled?.(next);
      if (next && event.currentTarget) {
        animateToTarget(event.currentTarget, targetSelector);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={value}
      aria-label={value ? activeLabel : inactiveLabel}
      title={value ? activeLabel : inactiveLabel}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm transition",
        value
          ? "border-[rgba(220,90,106,0.3)] bg-[rgba(255,232,236,0.96)] text-[#dc5a6a] shadow-[0_8px_18px_rgba(220,90,106,0.14)]"
          : "border-white/75 bg-white/88 text-[hsl(var(--muted-foreground))] hover:border-[rgba(220,90,106,0.24)] hover:text-[#dc5a6a]",
        pending && "opacity-70",
        className,
      )}
    >
      ♥
    </button>
  );
}
