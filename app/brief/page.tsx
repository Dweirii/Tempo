"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { usePlanner } from "@/lib/store";
import {
  weekById,
  categoryById,
  subcategoryById,
  currentWeek,
  weekCounts,
  itemsForDate,
} from "@/lib/selectors";
import {
  addDays,
  toISODate,
  formatWeekRange,
  formatDayLabel,
  DAY_NAMES_LONG,
} from "@/lib/dates";
import { FORMAT_META } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormatPill, StatusBadge, OwnerTag } from "@/components/ui/tags";

export default function BriefPage() {
  const { state } = usePlanner();
  const today = toISODate(new Date());
  const weeks = [...state.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const [weekId, setWeekId] = useState(
    () => currentWeek(state, today)?.id ?? weeks[0]?.id ?? "",
  );

  const week = weekById(state, weekId);
  const cat = week ? categoryById(state, week.categoryId) : undefined;
  const sub = week ? subcategoryById(state, week.subcategoryId) : undefined;
  const counts = week ? weekCounts(state, week.id) : undefined;

  return (
    <div className="print-exact">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 text-sm font-bold shadow-hard-sm push"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
          Calendar
        </Link>
        <div className="flex items-center gap-2">
          {weeks.length ? (
            <Select
              ariaLabel="Choose week"
              className="h-9 w-56 py-1.5"
              value={weekId}
              onValueChange={setWeekId}
              options={weeks.map((w) => ({
                value: w.id,
                label: `Week ${w.weekNumber} — ${w.theme}`,
              }))}
            />
          ) : null}
          <Button variant="primary" onClick={() => window.print()}>
            <Printer className="size-4" strokeWidth={2.5} />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {!week ? (
        <div className="panel p-6 font-semibold text-muted">
          No weeks generated yet.
        </div>
      ) : (
        <article className="panel overflow-hidden">
          {/* Masthead */}
          <header
            className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink p-5"
            style={{ backgroundColor: cat?.color }}
          >
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]">
                Weekly Brief · Block {week.blockNumber} · {cat?.name}
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold">
                {week.theme}
              </h1>
              <div className="mt-0.5 text-sm font-bold">
                Week {week.weekNumber} · {sub?.name} ·{" "}
                {formatWeekRange(week.startDate)}
              </div>
            </div>
            {counts ? (
              <div className="font-mono text-xs font-bold">
                {counts.posts} posts · {counts.reels} reels · {counts.stories}{" "}
                stories · {counts.custom} custom
              </div>
            ) : null}
          </header>

          {/* Days */}
          <div className="divide-y-2 divide-ink">
            {Array.from({ length: 7 }, (_, i) => addDays(week.startDate, i)).map(
              (date, i) => {
                const items = itemsForDate(state, date).filter(
                  (it) => it.weekId === week.id,
                );
                return (
                  <section key={date} className="flex gap-4 p-4">
                    <div className="w-28 shrink-0">
                      <div className="font-display text-base font-extrabold">
                        {DAY_NAMES_LONG[i]}
                      </div>
                      <div className="font-mono text-[11px] font-bold text-muted">
                        {formatDayLabel(date)}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      {items.map((it) => (
                        <div key={it.id} className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <FormatPill format={it.format} />
                            <span className="text-sm font-extrabold">
                              {it.slot}
                            </span>
                            <OwnerTag owner={it.owner} />
                            <StatusBadge status={it.status} />
                            {it.assignee ? (
                              <span className="font-mono text-[11px] font-bold text-muted">
                                @ {it.assignee}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm font-semibold leading-snug text-ink/80">
                            {it.concept}
                          </p>
                          {it.caption ? (
                            <p className="text-xs font-semibold italic leading-snug text-muted">
                              “{it.caption}”
                            </p>
                          ) : null}
                        </div>
                      ))}
                      <div
                        className="mt-0.5 flex items-center gap-2 rounded-md border-2 border-dashed border-ink/30 px-2 py-1"
                        style={{ backgroundColor: `${FORMAT_META.Story.bg}22` }}
                      >
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted">
                          Story
                        </span>
                        <span className="text-xs font-semibold">
                          {week.storyRotation[i] || "—"}
                        </span>
                      </div>
                    </div>
                  </section>
                );
              },
            )}
          </div>
        </article>
      )}
    </div>
  );
}
