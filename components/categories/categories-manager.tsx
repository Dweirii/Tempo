"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import type { Category, Subcategory } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { weekById } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

function SortableRow({
  sub,
  index,
  weekLabel,
  onToggle,
}: {
  sub: Subcategory;
  index: number;
  weekLabel?: string;
  onToggle: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sub.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-2 py-1.5",
        isDragging && "relative z-10 shadow-hard-lg",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted hover:text-ink active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-5 shrink-0 font-mono text-[10px] font-bold text-muted">
        {index + 1}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-bold",
          sub.used && "text-muted line-through",
        )}
      >
        {sub.name}
      </span>
      {sub.used && weekLabel ? (
        <span className="tag" style={{ backgroundColor: "#7ED98C" }}>
          {weekLabel}
        </span>
      ) : null}
      <button
        onClick={() => onToggle(sub.id)}
        className={cn(
          "shrink-0 rounded-md border-2 border-ink px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide push",
          sub.used ? "bg-mint" : "bg-white",
        )}
      >
        {sub.used ? "Used" : "Unused"}
      </button>
    </li>
  );
}

function CategoryPanel({ category }: { category: Category }) {
  const { state, toggleSubUsed, reorderSubcategories, addSubcategory } =
    usePlanner();
  const [newName, setNewName] = useState("");

  const subs = state.subcategories
    .filter((s) => s.categoryId === category.id)
    .sort((a, b) => a.order - b.order);
  const usedCount = subs.filter((s) => s.used).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = subs.map((s) => s.id);
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from !== -1 && to !== -1) {
      reorderSubcategories(category.id, arrayMove(ids, from, to));
    }
  };

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    addSubcategory(category.id, name);
    setNewName("");
  };

  return (
    <div className="panel flex flex-col overflow-hidden">
      <div
        className="border-b-2 border-ink px-4 py-3"
        style={{ backgroundColor: category.color }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">{category.name}</h2>
          <span className="rounded-md border-2 border-ink bg-white px-2 py-0.5 font-mono text-[10px] font-bold">
            {category.productCount.toLocaleString()} products
          </span>
        </div>
        <div className="mt-1 font-mono text-[11px] font-bold text-ink/70">
          {usedCount}/{subs.length} used in the queue
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext
            items={subs.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex max-h-[440px] flex-col gap-1.5 overflow-y-auto pr-1">
              {subs.map((sub, i) => {
                const w = sub.usedInWeekId
                  ? weekById(state, sub.usedInWeekId)
                  : undefined;
                return (
                  <SortableRow
                    key={sub.id}
                    sub={sub}
                    index={i}
                    weekLabel={w ? `W${w.weekNumber}` : undefined}
                    onToggle={toggleSubUsed}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2">
          <Input
            value={newName}
            placeholder="Add subcategory…"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button variant="primary" size="icon" onClick={add} aria-label="Add">
            <Plus className="size-4" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CategoriesManager() {
  const { state } = usePlanner();
  const categories = [...state.categories].sort((a, b) => a.order - b.order);

  return (
    <div>
      <PageHeader
        eyebrow="Queues"
        title="Categories"
      />
      <p className="mb-5 max-w-2xl text-sm font-semibold text-muted">
        Each block pulls the next <b className="text-ink">unused</b> subcategory
        from the top of a category&apos;s queue. Drag to reorder, toggle
        used/unused, or add new ones.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {categories.map((c) => (
          <CategoryPanel key={c.id} category={c} />
        ))}
      </div>
    </div>
  );
}
