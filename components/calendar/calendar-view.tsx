"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { usePlanner } from "@/lib/store";
import {
  monthGrid,
  monthTitle,
  startOfWeek,
  addDays,
  toISODate,
  parseISODate,
  formatWeekRange,
} from "@/lib/dates";
import { currentWeek } from "@/lib/selectors";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { GenerateBlockButton } from "@/components/generate-block";
import { ExportMenu } from "@/components/export-menu";
import { FilterBar } from "./filter-bar";
import { MonthGrid, MobileAgenda } from "./month-grid";
import { WeekView } from "./week-view";
import { DayEditorDrawer } from "./day-editor-drawer";
import { ChipFace } from "./item-chip";
import type { CalendarFilters } from "./filters";

type Mode = "month" | "week";

export function CalendarView() {
  const { state, moveItem } = usePlanner();
  const [today] = useState(() => toISODate(new Date()));
  const [mode, setMode] = useState<Mode>("month");
  const [anchor, setAnchor] = useState(
    () => currentWeek(state, today)?.startDate ?? today,
  );
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const days = useMemo(() => monthGrid(anchor), [anchor]);
  const weekStart = startOfWeek(anchor);
  const activeItem = activeId
    ? state.contentItems.find((i) => i.id === activeId)
    : undefined;

  const onSelect = (id: string) => {
    setSelectedItemId(id);
    setDrawerOpen(true);
  };

  const shiftMonth = (delta: number) => {
    const d = parseISODate(anchor);
    setAnchor(toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1)));
  };
  const shiftWeek = (delta: number) => setAnchor(addDays(anchor, delta * 7));
  const step = (delta: number) =>
    mode === "month" ? shiftMonth(delta) : shiftWeek(delta);

  const title = mode === "month" ? monthTitle(anchor) : formatWeekRange(weekStart);

  return (
    <div>
      <PageHeader eyebrow="Content calendar" title="Calendar">
        <Link
          href="/brief"
          className="inline-flex h-10 items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 text-sm font-bold shadow-hard push"
        >
          <FileText className="size-4" strokeWidth={2.5} />
          Brief
        </Link>
        <ExportMenu />
        <GenerateBlockButton />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Button size="icon" onClick={() => step(-1)} aria-label="Previous">
              <ChevronLeft className="size-4" strokeWidth={2.5} />
            </Button>
            <Button size="icon" onClick={() => step(1)} aria-label="Next">
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </Button>
          </div>
          <h2 className="min-w-0 font-display text-xl font-extrabold sm:text-2xl">
            {title}
          </h2>
          <Button size="sm" variant="ghost" onClick={() => setAnchor(today)}>
            Today
          </Button>
        </div>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "month", label: "Month" },
            { value: "week", label: "Week" },
          ]}
        />
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        categories={state.categories}
      />

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={(e: DragEndEvent) => {
          setActiveId(null);
          const overId = e.over ? String(e.over.id) : "";
          if (overId.startsWith("day:")) {
            moveItem(String(e.active.id), overId.slice(4));
          }
        }}
        onDragCancel={() => setActiveId(null)}
      >
        {mode === "month" ? (
          <>
            <MonthGrid
              state={state}
              monthAnchor={anchor}
              days={days}
              today={today}
              filters={filters}
              onSelect={onSelect}
            />
            <MobileAgenda
              state={state}
              days={days}
              monthAnchor={anchor}
              today={today}
              filters={filters}
              onSelect={onSelect}
            />
          </>
        ) : (
          <WeekView
            state={state}
            weekStart={weekStart}
            today={today}
            filters={filters}
            onSelect={onSelect}
          />
        )}

        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <div className="w-40">
              <ChipFace item={activeItem} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DayEditorDrawer
        itemId={selectedItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
