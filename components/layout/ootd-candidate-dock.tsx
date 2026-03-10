"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getOotdCandidates,
  onOotdCandidateMotion,
  onOotdCandidatesChanged,
  type OotdCandidateMotionDetail,
} from "@/lib/ootd-candidates";

type MotionParticle = {
  mode: "add" | "remove";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export function OotdCandidateDock({
  locale,
  label,
  initialCount = 0,
}: {
  locale: string;
  label: string;
  initialCount?: number;
}) {
  const dockRef = useRef<HTMLAnchorElement | null>(null);
  const [count, setCount] = useState(initialCount);
  const [pulse, setPulse] = useState<"add" | "remove" | null>(null);

  useEffect(() => {
    setCount(getOotdCandidates().length);
    return onOotdCandidatesChanged(() => {
      setCount(getOotdCandidates().length);
    });
  }, []);

  useEffect(() => {
    return onOotdCandidateMotion((detail) => {
      const targetRect = dockRef.current?.getBoundingClientRect();
      if (!targetRect) return;

      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;
      const motion = buildMotion(detail, targetX, targetY);

      playMotionParticle(motion);
      setPulse(detail.mode);

      window.setTimeout(() => {
        setPulse((current) => (current === detail.mode ? null : current));
      }, 360);
    });
  }, []);

  const badgeLabel = useMemo(() => `${label} (${count})`, [count, label]);

  return (
    <>
      <Link
        ref={dockRef}
        href={`/${locale}/ootd/candidates`}
        className={[
          "relative inline-flex h-12 items-center gap-3 rounded-full border px-4 pr-5 shadow-[0_12px_30px_rgba(77,57,36,0.12)] backdrop-blur-xl transition",
          pulse === "add"
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] scale-[1.03]"
            : pulse === "remove"
              ? "border-[rgba(214,154,97,0.55)] bg-[rgba(255,244,235,0.96)] text-[hsl(var(--primary))] scale-[1.02]"
              : "border-white/70 bg-white/86 text-[hsl(var(--foreground))]",
        ].join(" ")}
        aria-label={badgeLabel}
        title={badgeLabel}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.82)] text-[hsl(var(--primary))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 7a4 4 0 1 1 8 0" />
            <path d="M5 9h14l-1 9H6L5 9Z" />
            <path d="M9.5 12.5h5" />
          </svg>
        </span>
        <span className="text-sm font-semibold">{label}</span>
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[rgba(214,154,97,0.16)] px-2 py-0.5 text-xs font-semibold">
          {count}
        </span>
      </Link>
    </>
  );
}

function buildMotion(detail: OotdCandidateMotionDetail, targetX: number, targetY: number): MotionParticle {
  if (detail.mode === "add") {
    return {
      mode: detail.mode,
      startX: detail.sourceX,
      startY: detail.sourceY,
      endX: targetX,
      endY: targetY,
    };
  }

  return {
    mode: detail.mode,
    startX: targetX,
    startY: targetY,
    endX: detail.sourceX,
    endY: detail.sourceY,
  };
}

function playMotionParticle(particle: MotionParticle) {
  if (typeof document === "undefined") {
    return;
  }

  const element = document.createElement("div");
  const isAdd = particle.mode === "add";
  const deltaX = particle.endX - particle.startX;
  const deltaY = particle.endY - particle.startY;

  element.textContent = isAdd ? "+" : "-";
  element.setAttribute("aria-hidden", "true");
  element.style.position = "fixed";
  element.style.left = `${particle.startX}px`;
  element.style.top = `${particle.startY}px`;
  element.style.width = "36px";
  element.style.height = "36px";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.borderRadius = "9999px";
  element.style.fontSize = "18px";
  element.style.fontWeight = "700";
  element.style.lineHeight = "1";
  element.style.pointerEvents = "none";
  element.style.zIndex = "999";
  element.style.boxShadow = "0 12px 28px rgba(77,57,36,0.16)";
  element.style.border = isAdd ? "1px solid hsl(var(--primary))" : "1px solid rgba(214,154,97,0.52)";
  element.style.background = isAdd ? "hsl(var(--primary))" : "rgba(255,244,235,0.98)";
  element.style.color = isAdd ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))";
  element.style.transform = `translate(-50%, -50%) scale(${isAdd ? 1 : 0.72})`;
  element.style.opacity = "1";
  element.style.transition =
    "transform 760ms cubic-bezier(0.2,0.8,0.2,1), opacity 760ms cubic-bezier(0.2,0.8,0.2,1)";

  document.body.appendChild(element);

  window.requestAnimationFrame(() => {
    element.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${isAdd ? 0.68 : 1})`;
    element.style.opacity = "0.08";
  });

  window.setTimeout(() => {
    element.remove();
  }, 820);
}
