import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AuthErrorPanel({
  locale,
  title,
  subtitle,
  retryLabel,
  backLabel,
}: {
  locale: "zh-CN" | "en-US";
  title: string;
  subtitle: string;
  retryLabel: string;
  backLabel: string;
}) {
  return (
    <Card className="mx-auto max-w-2xl p-8">
      <div className="text-3xl font-semibold tracking-tight">{title}</div>
      <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{subtitle}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/${locale}/login`}>
          <Button>{retryLabel}</Button>
        </Link>
        <Link href={`/${locale}`}>
          <Button variant="outline">{backLabel}</Button>
        </Link>
      </div>
    </Card>
  );
}
