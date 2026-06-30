"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

// Exposes the signed-in user's display name app-wide, or null when Clerk is off
// or signed out. The Clerk hook is only called inside the enabled branch, so
// this is safe to mount without a ClerkProvider.
const CurrentUserContext = createContext<string | null>(null);

export function useCurrentUserName(): string | null {
  return useContext(CurrentUserContext);
}

function ClerkUserBridge({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const name = user
    ? user.fullName ||
      user.primaryEmailAddress?.emailAddress ||
      user.username ||
      null
    : null;
  return (
    <CurrentUserContext.Provider value={name}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function CurrentUserProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) {
    return (
      <CurrentUserContext.Provider value={null}>
        {children}
      </CurrentUserContext.Provider>
    );
  }
  return <ClerkUserBridge>{children}</ClerkUserBridge>;
}
