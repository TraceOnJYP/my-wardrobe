"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  label,
  callbackUrl,
}: {
  label: string;
  callbackUrl: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="shrink-0"
      onClick={() => {
        void signOut({ callbackUrl });
      }}
    >
      {label}
    </Button>
  );
}
