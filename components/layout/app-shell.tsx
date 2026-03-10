import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-[1440px] px-4 py-4 lg:px-6 lg:py-6">{children}</div>;
}
