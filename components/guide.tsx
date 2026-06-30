"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  HelpCircle,
  CalendarRange,
  Wand2,
  SquarePen,
  Columns3,
  Boxes,
  FileDown,
} from "lucide-react";
import { Modal } from "./ui/modal";

const STEPS = [
  {
    icon: CalendarRange,
    title: "Blocks & rotation",
    body: "Your calendar runs in 4-week blocks — each block focuses on one category, rotating through your categories in order. Inside a block, each week takes the next subcategory from that category's queue.",
  },
  {
    icon: Wand2,
    title: "Generate a block",
    body: "Hit “Generate next block” to create the next 4 weeks at once. Each week is auto-filled with 7 cards from the weekly cadence — Post 1, Reel 1, Post 2, Reel 2, Post 3, Stories, Custom Video — plus a daily story rotation. Everything starts at “Idea.”",
  },
  {
    icon: SquarePen,
    title: "Work a card",
    body: "Click any card to open its editor: concept, caption, hashtags, trending audio, image upload, owner, assignee and status. It saves as you type. Drag a card to another day to reschedule.",
  },
  {
    icon: Columns3,
    title: "Track on the Board",
    body: "The Board is your pipeline — Idea → In Design → Ready → Scheduled → Posted. Drag cards between columns to move them along.",
  },
  {
    icon: Boxes,
    title: "Categories & queues",
    body: "In Categories, add, rename, recolor and reorder your categories (that order is the rotation) and their subcategory queues. New workspaces can “Load starter catalog” to begin.",
  },
  {
    icon: FileDown,
    title: "Brief & Export",
    body: "“Brief” is a printable weekly shot list for shoots. “Export” downloads an .ics calendar for this week, this month, or everything.",
  },
];

interface GuideCtx {
  openGuide: () => void;
}
const Ctx = createContext<GuideCtx | null>(null);

export function useGuide(): GuideCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGuide must be used within a GuideProvider");
  return c;
}

export function GuideProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ openGuide: () => setOpen(true) }}>
      {children}
      <Modal
        open={open}
        onOpenChange={setOpen}
        accent="#FF90E8"
        title="How to use Tempo"
        subtitle="The 2-minute tour"
      >
        <ol className="flex flex-col gap-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-pink text-sm font-extrabold">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-display text-base font-extrabold">
                    <Icon className="size-4" strokeWidth={2.5} />
                    {s.title}
                  </div>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-muted">
                    {s.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Modal>
    </Ctx.Provider>
  );
}

export function GuideButton({ onNavigate }: { onNavigate?: () => void }) {
  const { openGuide } = useGuide();
  return (
    <button
      onClick={() => {
        openGuide();
        onNavigate?.();
      }}
      className="flex items-center gap-3 rounded-lg border-2 border-transparent px-3 py-2 text-sm font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white"
    >
      <HelpCircle className="size-[18px] shrink-0" strokeWidth={2.5} />
      How to use
    </button>
  );
}
