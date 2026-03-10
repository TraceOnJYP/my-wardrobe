import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

export function SyncStatusCard({ text, className }: { text: string; className?: string }) {
  return <Card className={cn("text-sm text-[hsl(var(--muted-foreground))]", className)}>{text}</Card>;
}
