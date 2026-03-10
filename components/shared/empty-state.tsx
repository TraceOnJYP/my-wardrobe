import { Card } from "@/components/ui/card";

export function EmptyState({ title }: { title: string }) {
  return (
    <Card className="border-dashed text-center text-sm text-[hsl(var(--muted-foreground))]">
      {title}
    </Card>
  );
}
