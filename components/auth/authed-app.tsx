"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth, useOrganization, OrganizationList } from "@clerk/nextjs";
import { PlannerProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";

function Splash({ label }: { label: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper">
      <div className="animate-pulse text-sm font-semibold tracking-wide text-neutral-500">
        {label}
      </div>
    </div>
  );
}

// When Clerk is enabled, require a signed-in user with an active organization
// before mounting the planner. Keying PlannerProvider by org id makes switching
// orgs reload that org's data.
export function AuthedApp({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: orgLoaded, organization } = useOrganization();

  if (isAuthRoute) {
    return (
      <main className="canvas-texture grid min-h-dvh place-items-center p-6">
        {children}
      </main>
    );
  }

  if (!authLoaded || (isSignedIn && !orgLoaded)) {
    return <Splash label="Loading…" />;
  }
  if (!isSignedIn) {
    return <Splash label="Redirecting to sign-in…" />;
  }
  if (!organization) {
    return (
      <main className="canvas-texture grid min-h-dvh place-items-center p-6">
        <div className="flex flex-col items-center gap-5">
          <div className="text-center">
            <div className="eyebrow">Tempo Studio</div>
            <h1 className="mt-1 font-display text-2xl font-extrabold">
              Choose a workspace
            </h1>
          </div>
          <OrganizationList
            hidePersonal
            afterCreateOrganizationUrl="/"
            afterSelectOrganizationUrl="/"
          />
        </div>
      </main>
    );
  }

  return (
    <PlannerProvider key={organization.id}>
      <AppShell>{children}</AppShell>
    </PlannerProvider>
  );
}
