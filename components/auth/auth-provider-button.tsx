"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { AuthProviderId, LoginProviderConfig } from "@/lib/auth/provider-config";

export function AuthProviderButton({
  provider,
  locale,
  callbackUrl,
  statusCopy,
}: {
  provider: LoginProviderConfig;
  locale: "zh-CN" | "en-US";
  callbackUrl: string;
  statusCopy: {
    enabled: string;
    notConfigured: string;
    planned: string;
  };
}) {
  if (provider.status !== "enabled") {
    return (
      <div className="rounded-[24px] border border-dashed border-[hsl(var(--border))] bg-white/70 px-5 py-4 text-left opacity-75">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">{provider.label[locale]}</div>
          <div className="rounded-full border border-[hsl(var(--border))] bg-white/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
            {provider.status === "planned" ? statusCopy.planned : statusCopy.notConfigured}
          </div>
        </div>
        <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{provider.description[locale]}</div>
      </div>
    );
  }

  return (
    <Button
      className="w-full justify-between rounded-[24px] px-5 py-4 text-left text-sm font-semibold"
      onClick={() => {
        void signIn(provider.id, { callbackUrl });
      }}
      type="button"
    >
      <span>{provider.label[locale]}</span>
      <span className="flex items-center gap-2 text-xs opacity-80">
        <span className="rounded-full border border-white/30 bg-white/15 px-2 py-0.5 uppercase">
          {provider.id.toUpperCase()}
        </span>
        <span>{statusCopy.enabled}</span>
      </span>
    </Button>
  );
}
