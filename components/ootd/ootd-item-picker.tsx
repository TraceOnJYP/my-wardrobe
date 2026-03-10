import { Card } from "@/components/ui/card";

export function OotdItemPicker({ text }: { text: string }) {
  return <Card className="text-sm text-[hsl(var(--muted-foreground))]">{text}</Card>;
}
