import { Card } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth/session";

export function ProfileSummary({ user }: { user: SessionUser }) {
  return (
    <Card>
      <div className="font-medium">{user.displayName ?? user.email}</div>
      <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{user.email}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
        {user.locale}
      </div>
    </Card>
  );
}
