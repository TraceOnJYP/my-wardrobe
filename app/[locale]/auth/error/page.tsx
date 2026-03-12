import { AuthErrorPanel } from "@/components/auth/auth-error-panel";
import { AppShell } from "@/components/layout/app-shell";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { Locale } from "@/features/i18n/routing";

export default async function AuthErrorPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <AppShell>
      <AuthErrorPanel
        backLabel={dict.auth.error.back}
        locale={locale}
        retryLabel={dict.auth.error.retry}
        subtitle={dict.auth.error.subtitle}
        title={dict.auth.error.title}
      />
    </AppShell>
  );
}
