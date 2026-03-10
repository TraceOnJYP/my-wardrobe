import { Card } from "@/components/ui/card";

export function SearchFilters({ text }: { text: string }) {
  return <Card className="text-sm text-[hsl(var(--muted-foreground))]">{text}</Card>;
}
