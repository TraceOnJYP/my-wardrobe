import Link from "next/link";

import { Card } from "@/components/ui/card";

interface HighlightItem {
  label: string;
  title: string;
  subtitle: string;
}

export function HomeGuidanceCard({
  title,
  subtitle,
  highlights,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  subtitle: string;
  highlights: HighlightItem[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <Card className="space-y-5 p-6">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{subtitle}</div>
      </div>

      <div className="space-y-3">
        {highlights.map((item) => (
          <div
            key={item.label}
            className="rounded-[22px] border border-white/60 bg-[rgba(255,255,255,0.62)] px-4 py-4"
          >
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              {item.label}
            </div>
            <div className="mt-2 text-base font-semibold">{item.title}</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{item.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-[0_10px_24px_rgba(77,57,36,0.16)]"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))]"
        >
          {secondaryLabel}
        </Link>
      </div>
    </Card>
  );
}
