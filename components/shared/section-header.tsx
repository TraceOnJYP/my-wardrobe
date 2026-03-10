export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p> : null}
    </div>
  );
}
