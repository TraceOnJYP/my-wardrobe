import { AuthLoginPanel } from "@/components/auth/auth-login-panel";
import { AppShell } from "@/components/layout/app-shell";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { Locale } from "@/features/i18n/routing";
import { getLoginProviders } from "@/lib/auth/provider-config";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  const dict = await getDictionary(locale);
  const providers = getLoginProviders();

  return (
    <AppShell>
      <AuthLoginPanel
        callbackUrl={callbackUrl ?? `/${locale}`}
        copy={dict.auth.login}
        locale={locale}
        providers={providers}
      />
    </AppShell>
  );
}
