"use client";

import { useDroppable } from "@dnd-kit/core";
import type { PlannerState } from "@/lib/types";
import {
  itemsForDate,
  weekForDate,
  categoryById,
  subcategoryById,
  weekCounts,
} from "@/lib/selectors";
import { addDays, DAY_NAMES, parseISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ItemChip } from "./item-chip";
import { itemPasses, type CalendarFilters } from "./filters";

interface SharedProps {
  state: PlannerState;
  today: string;
  filters: CalendarFilters;
  onSelect: (id: string) => void;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex flex-col items-center rounded-md border-2 border-ink bg-white px-2.5 py-1">
      <span className="text-base font-extrabold leading-none">{value}</span>
      <span className="font-mono text-[8px] font-bold uppercase tracking-wide text-muted">
        {label}
      </span>
    </span>
  );
}

function DayColumn({
  state,
  date,
  today,
  filters,
  onSelect,
  story,
}: SharedProps & { date: string; story?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}` });
  const d = parseISODate(date);
  const isToday = date === today;
  const items = itemsForDate(state, date).filter((i) =>
    itemPasses(state, i, filters),
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border-2 border-ink bg-white transition-colors",
        isOver && "bg-pink/40",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between rounded-t-[0.6rem] border-b-2 border-ink px-2.5 py-1.5",
          isToday && "bg-ink text-white",
        )}
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
          {DAY_NAMES[d.getDay()]}
        </span>
        <span className="text-sm font-extrabold">{d.getDate()}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        {items.length === 0 ? (
          <span className="px-1 py-2 text-[11px] font-semibold text-muted/60">
            No posts
          </span>
        ) : null}
        {items.map((i) => (
          <ItemChip key={i.id} item={i} onSelect={onSelect} />
        ))}
      </div>
      {story !== undefined ? (
        <div className="border-t-2 border-dashed border-ink/25 px-2.5 py-1.5">
          <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted">
            Story
          </div>
          <div className="text-[11px] font-semibold leading-snug text-ink/80">
            {story || "—"}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function WeekView({
  state,
  weekStart,
  today,
  filters,
  onSelect,
}: SharedProps & { weekStart: string }) {
  const week = weekForDate(state, weekStart);
  const cat = week ? categoryById(state, week.categoryId) : undefined;
  const sub = week ? subcategoryById(state, week.subcategoryId) : undefined;
  const counts = week ? weekCounts(state, week.id) : undefined;
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex flex-col gap-4">
      {week ? (
        <div className="panel flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
          <span
            className="size-5 shrink-0 rounded-full border-2 border-ink"
            style={{ background: cat?.color }}
          />
          <div className="min-w-0">
            <div className="font-display text-xl font-extrabold leading-tight">
              {week.theme}
            </div>
            <div className="font-mono text-[11px] font-semibold text-muted">
              Block {week.blockNumber} · Week {week.weekNumber} · {sub?.name}
            </div>
          </div>
          {counts ? (
            <div className="ml-auto flex gap-1.5">
              <Stat label="Posts" value={counts.posts} />
              <Stat label="Reels" value={counts.reels} />
              <Stat label="Stories" value={counts.stories} />
              <Stat label="Custom" value={counts.custom} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="panel p-4 text-sm font-semibold text-muted">
          No generated week starts here yet. Use{" "}
          <b className="text-ink">Generate next block</b>, or jump to a week with
          content.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-7">
        {dates.map((date, i) => (
          <DayColumn
            key={date}
            state={state}
            date={date}
            today={today}
            filters={filters}
            onSelect={onSelect}
            story={week ? week.storyRotation[i] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
