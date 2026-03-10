"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OotdForm({
  labels,
}: {
  labels: { scenario: string; save: string };
}) {
  return (
    <form className="space-y-4 rounded-[28px] border border-[hsl(var(--border))] bg-white p-5">
      <Input type="date" />
      <Input placeholder={labels.scenario} />
      <Button type="submit">{labels.save}</Button>
    </form>
  );
}
