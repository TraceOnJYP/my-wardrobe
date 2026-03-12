"use client";

import { Card } from "@/components/ui/card";
import { AuthProviderButton } from "@/components/auth/auth-provider-button";
import type { LoginProviderConfig } from "@/lib/auth/provider-config";

export function AuthLoginPanel({
  locale,
  copy,
  callbackUrl,
  providers,
}: {
  locale: "zh-CN" | "en-US";
  callbackUrl: string;
  providers: LoginProviderConfig[];
  copy: {
    eyebrow: string;
    title: string;
    subtitle: string;
    privacy: string;
    featuresTitle: string;
    features: string[];
    providerStatus: {
      enabled: string;
      notConfigured: string;
      planned: string;
    };
  };
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="p-8">
        <div className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--muted-foreground))]">
          {copy.eyebrow}
        </div>
        <div className="mt-4 text-4xl font-semibold tracking-tight">{copy.title}</div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[hsl(var(--muted-foreground))]">{copy.subtitle}</p>
        <div className="mt-8 space-y-3">
          {providers.map((provider) => (
            <AuthProviderButton
              key={provider.id}
              callbackUrl={callbackUrl}
              locale={locale}
              provider={provider}
              statusCopy={copy.providerStatus}
            />
          ))}
        </div>
        <p className="mt-5 text-xs leading-6 text-[hsl(var(--muted-foreground))]">{copy.privacy}</p>
      </Card>
      <Card className="p-8">
        <div className="text-lg font-semibold">{copy.featuresTitle}</div>
        <div className="mt-5 space-y-3 text-sm text-[hsl(var(--foreground))]">
          {copy.features.map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-white/40 bg-white/65 px-4 py-3 shadow-[0_8px_25px_rgba(77,57,36,0.05)]"
            >
              {feature}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
