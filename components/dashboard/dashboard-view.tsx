"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Film,
  Camera,
  Clapperboard,
  FileText,
} from "lucide-react";
import { usePlanner } from "@/lib/store";
import { STATUSES } from "@/lib/types";
import { STATUS_META, FORMAT_META } from "@/lib/ui";
import {
  currentWeek,
  weekCounts,
  statusCounts,
  dueSoon,
  categoryById,
  subcategoryById,
} from "@/lib/selectors";
import { toISODate, formatDayLabel, formatWeekRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { GenerateBlockButton } from "@/components/generate-block";
import { ExportMenu } from "@/components/export-menu";
import { FormatPill, StatusBadge } from "@/components/ui/tags";
import { DayEditorDrawer } from "@/components/calendar/day-editor-drawer";

function StatCard({
  label,
  value,
  bg,
  icon: Icon,
}: {
  label: string;
  value: number;
  bg: string;
  icon: typeof ImageIcon;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border-2 border-ink p-4 shadow-hard"
      style={{ backgroundColor: bg }}
    >
      <Icon className="size-5" strokeWidth={2.5} />
      <div className="font-display text-4xl font-extrabold leading-none">
        {value}
      </div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
        {label}
      </div>
    </div>
  );
}

export function DashboardView() {
  const { state } = usePlanner();
  const [today] = useState(() => toISODate(new Date()));
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const week = currentWeek(state, today);
  const counts = week
    ? weekCounts(state, week.id)
    : { posts: 0, reels: 0, stories: 0, custom: 0 };
  const cat = week ? categoryById(state, week.categoryId) : undefined;
  const blockWeeks = week
    ? state.weeks
        .filter((w) => w.blockNumber === week.blockNumber)
        .sort((a, b) => a.weekNumber - b.weekNumber)
    : [];
  const statuses = statusCounts(state.contentItems);
  const statusMax = Math.max(1, ...Object.values(statuses));
  const due = dueSoon(state, today, 3);

  const openItem = (id: string) => {
    setSelectedItemId(id);
    setDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard">
        <Link
          href="/brief"
          className="inline-flex h-10 items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 text-sm font-bold shadow-hard push"
        >
          <FileText className="size-4" strokeWidth={2.5} />
          Brief
        </Link>
        <ExportMenu />
        <GenerateBlockButton label="New block" />
      </PageHeader>

      {/* This week */}
      <div className="mb-2 flex items-center gap-2">
        <span className="eyebrow">This week</span>
        {week ? (
          <span className="font-mono text-[11px] font-bold text-muted">
            {formatWeekRange(week.startDate)} · {week.theme}
          </span>
        ) : null}
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Posts" value={counts.posts} bg={FORMAT_META.Post.bg} icon={ImageIcon} />
        <StatCard label="Reels" value={counts.reels} bg={FORMAT_META.Reel.bg} icon={Film} />
        <StatCard label="Stories" value={counts.stories} bg={FORMAT_META.Story.bg} icon={Camera} />
        <StatCard label="Custom" value={counts.custom} bg={FORMAT_META.Custom.bg} icon={Clapperboard} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* By status */}
        <div className="panel p-5">
          <h2 className="mb-4 font-display text-lg font-extrabold">By status</h2>
          <div className="flex flex-col gap-2.5">
            {STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <StatusBadge status={s} />
                </div>
                <div className="h-5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
                  <div
                    className="h-full border-r-2 border-ink"
                    style={{
                      width: `${Math.max(4, (statuses[s] / statusMax) * 100)}%`,
                      backgroundColor: STATUS_META[s].bg,
                    }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right font-mono text-sm font-extrabold">
                  {statuses[s]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Due in 3 days */}
        <div className="panel p-5">
          <h2 className="mb-4 font-display text-lg font-extrabold">
            Due in next 3 days
          </h2>
          {due.length === 0 ? (
            <div className="grid h-32 place-items-center text-sm font-semibold text-muted">
              Nothing due — you&apos;re ahead. 🎉
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {due.slice(0, 8).map((i) => (
                <li key={i.id}>
                  <button
                    onClick={() => openItem(i.id)}
                    className="flex w-full items-center gap-2 rounded-lg border-2 border-ink bg-white px-2.5 py-2 text-left push"
                  >
                    <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-muted">
                      {formatDayLabel(i.date).split(", ")[1] ??
                        formatDayLabel(i.date)}
                    </span>
                    <FormatPill format={i.format} />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold">
                      {i.slot}
                    </span>
                    <StatusBadge status={i.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Current block */}
      <div className="panel mt-4 p-5">
        <div className="mb-4 flex items-center gap-2">
          {cat ? (
            <span
              className="size-4 rounded-full border-2 border-ink"
              style={{ background: cat.color }}
            />
          ) : null}
          <h2 className="font-display text-lg font-extrabold">
            {week ? `Block ${week.blockNumber} — ${cat?.name}` : "No block yet"}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {blockWeeks.map((w) => {
            const c = weekCounts(state, w.id);
            const sub = subcategoryById(state, w.subcategoryId);
            const isCurrent = w.id === week?.id;
            return (
              <div
                key={w.id}
                className={cn(
                  "rounded-xl border-2 border-ink p-3",
                  isCurrent ? "bg-pink/30 shadow-hard" : "bg-white",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-muted">
                    Week {w.weekNumber}
                  </span>
                  {isCurrent ? (
                    <span className="tag" style={{ backgroundColor: "#FF90E8" }}>
                      Now
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 line-clamp-2 font-display text-sm font-extrabold leading-tight">
                  {w.theme}
                </div>
                <div className="mt-0.5 truncate text-[11px] font-semibold text-muted">
                  {sub?.name}
                </div>
                <div className="mt-2 font-mono text-[10px] font-bold text-muted">
                  {formatWeekRange(w.startDate)}
                </div>
                <div className="mt-2 flex gap-1 text-[10px] font-bold">
                  <span className="rounded border-2 border-ink bg-white px-1">
                    {c.posts}P
                  </span>
                  <span className="rounded border-2 border-ink bg-white px-1">
                    {c.reels}R
                  </span>
                  <span className="rounded border-2 border-ink bg-white px-1">
                    {c.stories}S
                  </span>
                  <span className="rounded border-2 border-ink bg-white px-1">
                    {c.custom}C
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DayEditorDrawer
        itemId={selectedItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
