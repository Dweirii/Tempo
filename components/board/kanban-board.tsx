"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { ContentItem, Status } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { STATUS_META, FORMAT_META } from "@/lib/ui";
import { usePlanner } from "@/lib/store";
import { categoryById, weekById, subcategoryById } from "@/lib/selectors";
import { formatDayLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { GenerateBlockButton } from "@/components/generate-block";
import { FormatPill, OwnerTag } from "@/components/ui/tags";
import { DayEditorDrawer } from "@/components/calendar/day-editor-drawer";
import { FilterBar } from "@/components/calendar/filter-bar";
import { itemPasses, type CalendarFilters } from "@/components/calendar/filters";
import { useCurrentUserName } from "@/components/auth/current-user";

function CardFace({ item, dragging }: { item: ContentItem; dragging?: boolean }) {
  const { state, assets } = usePlanner();
  const week = weekById(state, item.weekId);
  const cat = week ? categoryById(state, week.categoryId) : undefined;
  const sub = week ? subcategoryById(state, week.subcategoryId) : undefined;
  const cover = assets.find((a) => a.contentItemId === item.id);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border-2 border-ink bg-white p-2.5",
        dragging ? "rotate-[-1.5deg] shadow-hard-lg" : "shadow-hard-sm",
      )}
    >
      {cover ? (
        <div className="overflow-hidden rounded-md border-2 border-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.url}
            alt=""
            className="h-24 w-full object-cover"
          />
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <FormatPill format={item.format} />
        <span className="font-mono text-[10px] font-bold text-muted">
          {formatDayLabel(item.date)}
        </span>
      </div>
      <div className="text-sm font-extrabold leading-tight">{item.slot}</div>
      <p className="line-clamp-2 text-xs font-semibold leading-snug text-ink/70">
        {item.concept}
      </p>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-full border border-ink"
            style={{ background: cat?.color }}
          />
          <span className="truncate font-mono text-[10px] font-semibold text-muted">
            {sub?.name}
          </span>
        </span>
        <OwnerTag owner={item.owner} />
      </div>
    </div>
  );
}

function Card({
  item,
  onSelect,
}: {
  item: ContentItem;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { type: "card" },
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full cursor-grab touch-none text-left active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <CardFace item={item} />
    </button>
  );
}

function Column({
  status,
  items,
  onSelect,
}: {
  status: Status;
  items: ContentItem[];
  onSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `status:${status}` });
  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div
        className="mb-2 flex items-center justify-between rounded-lg border-2 border-ink px-3 py-2"
        style={{ backgroundColor: STATUS_META[status].bg }}
      >
        <span className="font-display text-sm font-extrabold">{status}</span>
        <span className="grid size-6 place-items-center rounded-full border-2 border-ink bg-white text-xs font-extrabold">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl border-2 border-dashed p-2 transition-colors",
          isOver ? "border-ink bg-pink/30" : "border-ink/20",
        )}
      >
        {items.map((i) => (
          <Card key={i.id} item={i} onSelect={onSelect} />
        ))}
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center py-6 text-[11px] font-semibold text-muted/60">
            Drop here
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { state, setStatus } = usePlanner();
  const me = useCurrentUserName();
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const visible = state.contentItems.filter((i) => itemPasses(state, i, filters));
  const activeItem = activeId
    ? state.contentItems.find((i) => i.id === activeId)
    : undefined;

  const onSelect = (id: string) => {
    setSelectedItemId(id);
    setDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader eyebrow="Pipeline" title="Board">
        <GenerateBlockButton label="New block" />
      </PageHeader>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        categories={state.categories}
        currentUser={me}
      />

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={(e: DragEndEvent) => {
          setActiveId(null);
          const overId = e.over ? String(e.over.id) : "";
          if (overId.startsWith("status:")) {
            setStatus(String(e.active.id), overId.slice(7) as Status);
          }
        }}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              items={visible
                .filter((i) => i.status === status)
                .sort((a, b) => a.date.localeCompare(b.date))}
              onSelect={onSelect}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <div className="w-[260px]">
              <CardFace item={activeItem} dragging />
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
