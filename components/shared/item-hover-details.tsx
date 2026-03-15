"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getItemDisplayCategory } from "@/lib/item-display";
import type { WardrobeItem } from "@/types/item";

interface ItemHoverLabels {
  brand: string;
  category: string;
  color: string;
  designElements: string;
  material: string;
  season: string;
  tags: string;
  price: string;
  empty: string;
}

export function ItemHoverDetails({
  item,
  labels,
}: {
  item: WardrobeItem;
  labels: ItemHoverLabels;
}) {
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 240, placement: "bottom" as "top" | "bottom" });

  const rows = [
    { label: labels.brand, value: item.brand },
    { label: labels.category, value: getItemDisplayCategory(item) },
    { label: labels.color, value: item.color },
    { label: labels.designElements, value: item.designElements },
    { label: labels.material, value: item.material },
    { label: labels.season, value: item.season.join(" / ") },
    { label: labels.tags, value: item.tags.join(" / ") },
    { label: labels.price, value: item.price !== undefined ? String(item.price) : undefined },
  ].filter((row) => row.value && row.value.trim() !== "");

  useEffect(() => {
    const anchor = markerRef.current?.parentElement;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const maxWidth = Math.min(320, window.innerWidth - 24);
      const left = Math.min(rect.left, window.innerWidth - maxWidth - 12);
      const estimatedHeight = rows.length > 0 ? Math.min(280, 24 + rows.length * 26) : 72;
      const placement =
        rect.bottom + 10 + estimatedHeight > window.innerHeight - 12 && rect.top - 10 - estimatedHeight > 12
          ? "top"
          : "bottom";
      const top = placement === "top" ? rect.top - estimatedHeight - 10 : rect.bottom + 10;

      setPosition({
        top: Math.max(12, top),
        left: Math.max(12, left),
        width: Math.max(240, Math.min(maxWidth, rect.width + 80)),
        placement,
      });
    };

    const openPanel = () => {
      updatePosition();
      setOpen(true);
    };

    const closePanel = () => {
      setOpen(false);
    };

    anchor.addEventListener("mouseenter", openPanel);
    anchor.addEventListener("mouseleave", closePanel);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      anchor.removeEventListener("mouseenter", openPanel);
      anchor.removeEventListener("mouseleave", closePanel);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  return (
    <>
      <span ref={markerRef} className="hidden" aria-hidden="true" />
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[220] rounded-[18px] border border-white/80 bg-[rgba(255,252,248,0.98)] p-3 shadow-[0_16px_35px_rgba(77,57,36,0.16)] backdrop-blur-xl"
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                maxWidth: 320,
              }}
            >
              <div className="space-y-1.5 text-xs leading-5 text-[hsl(var(--foreground))]">
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[56px_1fr] gap-2">
                      <div className="text-[hsl(var(--muted-foreground))]">{row.label}</div>
                      <div className="break-words font-medium">{row.value}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-[hsl(var(--muted-foreground))]">{labels.empty}</div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
