import { OotdCandidateDock } from "@/components/layout/ootd-candidate-dock";

export function Topbar({
  locale,
  title,
  subtitle,
  candidateLabel,
  candidateCount = 0,
}: {
  locale: string;
  title: string;
  subtitle: string;
  candidateLabel: string;
  candidateCount?: number;
}) {
  return (
    <div className="rounded-[32px] border border-white/60 bg-white/45 px-6 py-6 shadow-[0_14px_40px_rgba(77,57,36,0.08)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
            Smart Wardrobe
          </div>
          <div className="text-2xl font-semibold tracking-tight">{title}</div>
          <div className="max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {subtitle}
          </div>
        </div>
        <div className="flex justify-end">
          <OotdCandidateDock locale={locale} label={candidateLabel} initialCount={candidateCount} />
        </div>
      </div>
    </div>
  );
}
