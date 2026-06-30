"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ContentItem, PlannerState } from "@/lib/types";
import { itemsForDate } from "@/lib/selectors";
import {
  DAY_NAMES,
  parseISODate,
  isSameMonth,
  formatDayLabel,
} from "@/lib/dates";
import { FORMAT_META, STATUS_META } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { ItemChip } from "./item-chip";
import { itemPasses, type CalendarFilters } from "./filters";

interface SharedProps {
  state: PlannerState;
  today: string;
  filters: CalendarFilters;
  onSelect: (id: string) => void;
}

function visibleItems(
  state: PlannerState,
  date: string,
  filters: CalendarFilters,
): ContentItem[] {
  return itemsForDate(state, date).filter((i) => itemPasses(state, i, filters));
}

function DayCell({
  state,
  date,
  monthAnchor,
  today,
  filters,
  onSelect,
}: SharedProps & { date: string; monthAnchor: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}` });
  const d = parseISODate(date);
  const inMonth = isSameMonth(date, monthAnchor);
  const isToday = date === today;
  const items = visibleItems(state, date, filters);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[112px] flex-col gap-1 border-b-2 border-r-2 border-ink p-1.5 transition-colors",
        !inMonth && "bg-black/[0.035]",
        isOver && "bg-pink/40",
      )}
    >
      <div className="px-0.5">
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full text-xs font-extrabold",
            isToday
              ? "bg-ink text-white"
              : inMonth
                ? "text-ink"
                : "text-muted/50",
          )}
        >
          {d.getDate()}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {items.map((i) => (
          <ItemChip key={i.id} item={i} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

export function MonthGrid({
  state,
  monthAnchor,
  days,
  today,
  filters,
  onSelect,
}: SharedProps & { monthAnchor: string; days: string[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border-2 border-ink bg-white shadow-hard md:block">
      <div className="grid grid-cols-7 bg-ink">
        {DAY_NAMES.map((n) => (
          <div
            key={n}
            className="border-r-2 border-white/15 px-2 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-white last:border-r-0"
          >
            {n}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t-2 border-ink [&>*:nth-child(7n)]:border-r-0">
        {days.map((date) => (
          <DayCell
            key={date}
            state={state}
            date={date}
            monthAnchor={monthAnchor}
            today={today}
            filters={filters}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export function MobileAgenda({
  state,
  days,
  monthAnchor,
  today,
  filters,
  onSelect,
}: SharedProps & { days: string[]; monthAnchor: string }) {
  const rows = days
    .filter((d) => isSameMonth(d, monthAnchor))
    .map((date) => ({ date, items: visibleItems(state, date, filters) }))
    .filter((r) => r.items.length > 0);

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {rows.length === 0 ? (
        <div className="panel p-5 text-sm font-semibold text-muted">
          Nothing scheduled in this month{" "}
          {Object.keys(filters).length ? "for these filters" : ""}.
        </div>
      ) : null}
      {rows.map(({ date, items }) => (
        <div key={date} className="panel p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-sm font-extrabold">
              {formatDayLabel(date)}
            </span>
            {date === today ? (
              <span className="tag" style={{ backgroundColor: "#FF90E8" }}>
                Today
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            {items.map((i) => (
              <button
                key={i.id}
                onClick={() => onSelect(i.id)}
                className="flex items-center gap-2 rounded-lg border-2 border-ink px-2 py-1.5 push"
                style={{ backgroundColor: FORMAT_META[i.format].bg }}
              >
                <span className="shrink-0 text-[11px] font-extrabold">
                  {i.slot}
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold text-ink/70">
                  {i.concept}
                </span>
                <span
                  className="size-2.5 shrink-0 rounded-full border border-ink"
                  style={{ background: STATUS_META[i.status].bg }}
                />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
