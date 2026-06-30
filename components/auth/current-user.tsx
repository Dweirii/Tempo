"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";

// Team context: the signed-in user's display name + the active org's member
// names. Clerk hooks are only called in the enabled branch, so this is safe to
// mount without a ClerkProvider (it just yields nulls/empties).
interface TeamInfo {
  currentUserName: string | null;
  memberNames: string[];
}

const TeamContext = createContext<TeamInfo>({
  currentUserName: null,
  memberNames: [],
});

export function useCurrentUserName(): string | null {
  return useContext(TeamContext).currentUserName;
}

export function useTeamMemberNames(): string[] {
  return useContext(TeamContext).memberNames;
}

function nameOf(u: {
  firstName?: string | null;
  lastName?: string | null;
  identifier?: string | null;
}): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.identifier || "";
}

function ClerkTeamBridge({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { memberships } = useOrganization({ memberships: true });

  const currentUserName = user
    ? user.fullName ||
      user.primaryEmailAddress?.emailAddress ||
      user.username ||
      null
    : null;

  const memberNames = Array.from(
    new Set(
      (memberships?.data ?? [])
        .map((m) => (m.publicUserData ? nameOf(m.publicUserData) : ""))
        .filter((n): n is string => n.length > 0),
    ),
  );

  return (
    <TeamContext.Provider value={{ currentUserName, memberNames }}>
      {children}
    </TeamContext.Provider>
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
      <TeamContext.Provider value={{ currentUserName: null, memberNames: [] }}>
        {children}
      </TeamContext.Provider>
    );
  }
  return <ClerkTeamBridge>{children}</ClerkTeamBridge>;
}
