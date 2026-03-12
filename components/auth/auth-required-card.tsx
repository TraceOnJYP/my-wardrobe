import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AuthRequiredCard({
  locale,
  title,
  subtitle,
  action,
  callbackUrl,
}: {
  locale: "zh-CN" | "en-US";
  title: string;
  subtitle: string;
  action: string;
  callbackUrl: string;
}) {
  return (
    <Card className="p-8">
      <div className="max-w-2xl">
        <div className="text-2xl font-semibold tracking-tight">{title}</div>
        <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        <div className="mt-6">
          <Link href={`/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            <Button>{action}</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
