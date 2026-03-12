import { Card } from "@/components/ui/card";

type ProviderId = "google" | "apple" | "wechat";

export function AccountProviderList({
  title,
  emptyText,
  providers,
  labels,
}: {
  title: string;
  emptyText: string;
  providers: ProviderId[];
  labels: Record<ProviderId, string>;
}) {
  const uniqueProviders = [...new Set(providers)];

  return (
    <Card>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {uniqueProviders.length > 0 ? (
          uniqueProviders.map((provider) => (
            <div
              key={provider}
              className="rounded-full border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-sm"
            >
              {labels[provider]}
            </div>
          ))
        ) : (
          <div className="text-sm text-[hsl(var(--muted-foreground))]">{emptyText}</div>
        )}
      </div>
    </Card>
  );
}
