import { Card } from "@/components/ui/card";
import type { OotdRecord } from "@/types/ootd";

export function OotdTimeline({
  records,
  locale,
  labels,
}: {
  records: OotdRecord[];
  locale: string;
  labels: {
    daily: string;
    items: string;
    notes: string;
    noNotes: string;
    previewItems: string;
  };
}) {
  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.id} className="relative z-0 overflow-visible p-0 hover:z-40">
          <a
            href={`/${locale}/ootd?day=${record.wearDate}`}
            className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 rounded-[28px] px-5 py-5"
          >
            {record.imageUrl ? (
              <div
                className="aspect-square rounded-[20px] bg-cover bg-center shadow-[0_10px_24px_rgba(77,57,36,0.1)]"
                style={{ backgroundImage: `url(${record.imageUrl})` }}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-[20px] bg-[linear-gradient(160deg,#ead6c1,#f8f4ee)] text-xs font-medium text-[hsl(var(--muted-foreground))]">
                {labels.daily}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-medium">{record.wearDate}</div>
              <div className="group/details relative mt-1 inline-block max-w-full align-top">
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  {record.scenario ?? labels.daily} · {record.itemIds.length} {labels.items}
                </div>
                <div className="pointer-events-none absolute left-0 top-full z-[120] mt-2 w-[min(28rem,calc(100vw-5rem))] rounded-[24px] border border-white/75 bg-[rgba(255,255,255,0.98)] p-4 opacity-0 shadow-[0_20px_38px_rgba(77,57,36,0.18)] transition duration-150 group-hover/details:pointer-events-auto group-hover/details:opacity-100">
                  <div className="text-sm font-semibold">{record.scenario ?? labels.daily}</div>
                  <div className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                    {labels.notes}
                  </div>
                  <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {record.notes?.trim() ? record.notes : labels.noNotes}
                  </div>
                  <div className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                    {labels.previewItems}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {record.itemTitles.slice(0, 4).map((title, index) => (
                      <span
                        key={`${record.id}-${index}-${title}`}
                        className="rounded-full bg-[rgba(121,82,48,0.08)] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))]"
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
}
