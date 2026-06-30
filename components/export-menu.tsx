"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download, ChevronDown } from "lucide-react";
import type { ContentItem, PlannerState } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { weekById, subcategoryById, currentWeek } from "@/lib/selectors";
import { toISODate, isSameMonth } from "@/lib/dates";
import { buildICS, type IcsEvent } from "@/lib/ics";
import { Button } from "./ui/button";

function eventsFor(state: PlannerState, items: ContentItem[]): IcsEvent[] {
  return items.map((i) => {
    const week = weekById(state, i.weekId);
    const sub = week ? subcategoryById(state, week.subcategoryId) : undefined;
    const description = [
      i.concept && `Concept: ${i.concept}`,
      i.caption && `Caption: ${i.caption}`,
      `Format: ${i.format} · Owner: ${i.owner}`,
      i.assignee && `Assignee: ${i.assignee}`,
      `Status: ${i.status}`,
      i.hashtags,
    ]
      .filter(Boolean)
      .join("\n");
    return {
      uid: `${i.id}@brandex`,
      date: i.date,
      summary: `${i.slot} · ${sub?.name ?? ""}`.trim(),
      description,
      categories: i.format,
    };
  });
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportMenu() {
  const { state } = usePlanner();

  const exportScope = (scope: "week" | "month" | "all") => {
    const today = toISODate(new Date());
    let items = state.contentItems;
    if (scope === "week") {
      const wk = currentWeek(state, today);
      items = wk ? state.contentItems.filter((i) => i.weekId === wk.id) : [];
    } else if (scope === "month") {
      items = state.contentItems.filter((i) => isSameMonth(i.date, today));
    }
    download(`brandex-${scope}.ics`, buildICS(eventsFor(state, items), new Date()));
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="default">
          <Download className="size-4" strokeWidth={2.5} />
          Export
          <ChevronDown className="size-3.5" strokeWidth={2.5} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-[60] w-52 rounded-lg border-2 border-ink bg-white p-1 shadow-hard-lg"
        >
          <div className="px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            Export .ics calendar
          </div>
          {(
            [
              ["week", "This week"],
              ["month", "This month"],
              ["all", "Everything"],
            ] as const
          ).map(([scope, label]) => (
            <DropdownMenu.Item
              key={scope}
              onSelect={() => exportScope(scope)}
              className="cursor-pointer rounded-md px-2 py-1.5 text-sm font-semibold outline-none data-[highlighted]:bg-pink/40"
            >
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
