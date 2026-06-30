import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { PlannerProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { CurrentUserProvider } from "@/components/auth/current-user";
import { AuthedApp } from "@/components/auth/authed-app";
import { clerkEnabled } from "@/lib/auth";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tempo Studio Planner",
  description: "Content calendar & cadence engine for Tempo Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // With Clerk on: AuthedApp gates sign-in + active org, then mounts the planner
  // (keyed by org). Off: mount the planner directly under a single default org.
  const inner = clerkEnabled ? (
    <AuthedApp>{children}</AuthedApp>
  ) : (
    <PlannerProvider>
      <AppShell>{children}</AppShell>
    </PlannerProvider>
  );

  const html = (
    <html
      lang="en"
      className={`${bricolage.variable} ${hanken.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full">
        <CurrentUserProvider enabled={clerkEnabled}>{inner}</CurrentUserProvider>
      </body>
    </html>
  );

  // ClerkProvider only mounts when keys are configured (see lib/auth.ts).
  return clerkEnabled ? <ClerkProvider>{html}</ClerkProvider> : html;
}
