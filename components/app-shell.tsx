"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDays,
  Columns3,
  LayoutDashboard,
  Boxes,
  Menu,
  X,
} from "lucide-react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/lib/store";
import { currentWeek, categoryById } from "@/lib/selectors";
import { toISODate } from "@/lib/dates";
import { clerkEnabled } from "@/lib/auth";
import { GuideProvider, GuideButton } from "@/components/guide";
import { WelcomeDialog } from "@/components/welcome";

const NAV = [
  { href: "/", label: "Calendar", icon: CalendarDays },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/categories", label: "Categories", icon: Boxes },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg border-2 px-3 py-2 text-sm font-bold tracking-tight transition-all",
              active
                ? "border-ink bg-pink text-ink shadow-[3px_3px_0_0_#fff]"
                : "border-transparent text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={2.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BlockChip() {
  const { state } = usePlanner();
  const today = toISODate(new Date());
  const week = currentWeek(state, today);
  const cat = week ? categoryById(state, week.categoryId) : undefined;
  if (!week || !cat) return null;
  return (
    <div className="rounded-lg border-2 border-white/25 bg-white/5 p-3">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
        Now running
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className="size-3.5 shrink-0 rounded-full border-2 border-ink"
          style={{ background: cat.color }}
        />
        <span className="truncate text-sm font-extrabold text-white">
          Block {week.blockNumber} · {cat.name}
        </span>
      </div>
      <div className="mt-0.5 truncate text-xs font-semibold text-white/55">
        Week {week.weekNumber} — {week.theme}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="leading-none">
        <span className="block font-display text-lg font-extrabold tracking-tight text-white">
          Tempo
        </span>
        <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-pink">
          Studio Planner
        </span>
      </span>
    </Link>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-1 pt-1">
        <Brand />
      </div>
      <NavLinks onNavigate={onNavigate} />
      <GuideButton onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-3">
        <BlockChip />
        {clerkEnabled ? (
          <div className="rounded-lg border-2 border-ink bg-white px-1.5 py-1">
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/"
              afterCreateOrganizationUrl="/"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger: "w-full justify-start gap-2",
                },
              }}
            />
          </div>
        ) : null}
        {clerkEnabled ? (
          <div className="flex items-center gap-2.5 rounded-lg border-2 border-white/25 bg-white/5 px-3 py-2">
            <UserButton />
            <span className="min-w-0 truncate text-xs font-bold text-white">
              My account
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg border-2 border-white/25 bg-white/5 px-3 py-2">
            <span className="grid size-7 place-items-center rounded-full border-2 border-ink bg-sun text-xs font-extrabold text-ink">
              BX
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-bold text-white">
                Studio Team
              </span>
              <span className="block truncate text-[10px] font-semibold text-white/45">
                Internal · local
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Auth routes render standalone (no sidebar) so the sign-in card is centered.
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return (
      <main className="canvas-texture grid min-h-dvh place-items-center p-6">
        {children}
      </main>
    );
  }

  return (
    <GuideProvider>
      <div className="min-h-dvh ">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r-2 border-ink bg-ink md:block rounded-tr-2xl rounded-br-2xl">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b-2 border-ink bg-ink px-4 py-3 md:hidden">
        <Brand />
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger asChild>
            <button
              className="grid size-9 place-items-center rounded-lg border-2 border-white/30 text-white"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 [animation:overlay-in_140ms_ease]" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r-2 border-ink bg-ink [animation:sheet-in_200ms_cubic-bezier(0.2,0.9,0.3,1)]">
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <div className="flex justify-end p-3">
                <Dialog.Close
                  className="grid size-8 place-items-center rounded-md border-2 border-white/30 text-white"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </Dialog.Close>
              </div>
              <SidebarInner onNavigate={() => setMenuOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      {/* Content canvas */}
      <main className="canvas-texture min-h-dvh md:pl-64">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
        <WelcomeDialog />
      </div>
    </GuideProvider>
  );
}
