"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AuthSuccessBanner({
  title,
  description,
  dismissLabel,
}: {
  title: string;
  description: string;
  dismissLabel: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const isVisible = useMemo(() => searchParams.get("auth") === "success" && !dismissed, [dismissed, searchParams]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/72 px-5 py-4 shadow-[0_10px_26px_rgba(77,57,36,0.08)] backdrop-blur-md">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => {
            setDismissed(true);
            const params = new URLSearchParams(searchParams.toString());
            params.delete("auth");
            const nextQuery = params.toString();
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
          }}
        >
          {dismissLabel}
        </Button>
      </div>
    </div>
  );
}
