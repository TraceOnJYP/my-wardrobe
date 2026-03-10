import { Card } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth/session";

export function ProfileSummary({ user }: { user: SessionUser }) {
  return (
    <Card>
      <div className="font-medium">{user.email}</div>
      <div className="text-sm text-[hsl(var(--muted-foreground))]">{user.locale}</div>
    </Card>
  );
}
