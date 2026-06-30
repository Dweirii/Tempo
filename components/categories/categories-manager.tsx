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
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import type { Category, Subcategory } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { weekById } from "@/lib/selectors";
import { CATEGORY_COLORS } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Category color"
          className="size-6 shrink-0 rounded-full border-2 border-ink"
          style={{ background: value }}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          className="z-[60] grid grid-cols-4 gap-1.5 rounded-lg border-2 border-ink bg-white p-2 shadow-hard-lg"
        >
          {CATEGORY_COLORS.map((c) => (
            <DropdownMenu.Item
              key={c}
              onSelect={() => onChange(c)}
              className="grid size-7 cursor-pointer place-items-center rounded-md border-2 border-ink outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-ink"
              style={{ background: c }}
            >
              {c === value ? (
                <Check className="size-4 text-ink" strokeWidth={3} />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

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

function CategoryCard({
  category,
  index,
  total,
}: {
  category: Category;
  index: number;
  total: number;
}) {
  const {
    state,
    toggleSubUsed,
    reorderSubcategories,
    addSubcategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = usePlanner();
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const subs = state.subcategories
    .filter((s) => s.categoryId === category.id)
    .sort((a, b) => a.order - b.order);
  const usedCount = subs.filter((s) => s.used).length;
  const weekCount = state.weeks.filter((w) => w.categoryId === category.id).length;

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

  const move = (dir: -1 | 1) => {
    const ids = [...state.categories]
      .sort((a, b) => a.order - b.order)
      .map((c) => c.id);
    const to = index + dir;
    if (to < 0 || to >= ids.length) return;
    reorderCategories(arrayMove(ids, index, to));
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
        className="border-b-2 border-ink px-3 py-3"
        style={{ backgroundColor: category.color }}
      >
        <div className="flex items-center gap-2">
          <ColorPicker
            value={category.color}
            onChange={(color) => updateCategory(category.id, { color })}
          />
          <input
            value={category.name}
            onChange={(e) => updateCategory(category.id, { name: e.target.value })}
            aria-label="Category name"
            className="min-w-0 flex-1 bg-transparent font-display text-lg font-extrabold outline-none placeholder:text-ink/40"
            placeholder="Category name"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => move(-1)}
              disabled={index === 0}
              aria-label="Move up in rotation"
              className="grid size-6 place-items-center rounded border-2 border-ink bg-white disabled:opacity-30"
            >
              <ChevronUp className="size-3.5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => move(1)}
              disabled={index === total - 1}
              aria-label="Move down in rotation"
              className="grid size-6 place-items-center rounded border-2 border-ink bg-white disabled:opacity-30"
            >
              <ChevronDown className="size-3.5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete category"
              className="grid size-6 place-items-center rounded border-2 border-ink bg-white text-[#c0392b]"
            >
              <Trash2 className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 font-mono text-[11px] font-bold text-ink/70">
          <span>Rotation #{index + 1}</span>
          <span>·</span>
          <span>
            {usedCount}/{subs.length} used
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext
            items={subs.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex max-h-[360px] flex-col gap-1.5 overflow-y-auto pr-1">
              {subs.length === 0 ? (
                <li className="rounded-lg border-2 border-dashed border-ink/30 px-3 py-4 text-center text-xs font-semibold text-muted">
                  No subcategories yet — add the weekly themes below.
                </li>
              ) : null}
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
          <Button
            variant="primary"
            size="icon"
            onClick={add}
            aria-label="Add subcategory"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${category.name || "category"}?`}
        subtitle="This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-[#ff6b6b]"
              onClick={() => {
                deleteCategory(category.id);
                setConfirmDelete(false);
              }}
            >
              <Trash2 className="size-4" strokeWidth={2.5} />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm font-semibold text-muted">
          Removes the category, its {subs.length} subcategories
          {weekCount
            ? ` and ${weekCount} generated week${weekCount > 1 ? "s" : ""} of content`
            : ""}
          .
        </p>
      </Modal>
    </div>
  );
}

function AddCategoryCard() {
  const { state, addCategory } = usePlanner();
  const usedColors = new Set(state.categories.map((c) => c.color));
  const defaultColor =
    CATEGORY_COLORS.find((c) => !usedColors.has(c)) ?? CATEGORY_COLORS[0];
  const [name, setName] = useState("");
  const [color, setColor] = useState(defaultColor);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    addCategory(n, color);
    setName("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-ink/40 bg-white/60 p-4">
      <div className="flex items-center gap-2">
        <ColorPicker value={color} onChange={setColor} />
        <span className="font-display text-lg font-extrabold text-muted">
          New category
        </span>
      </div>
      <Input
        value={name}
        placeholder="Category name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
      />
      <Button variant="primary" onClick={add}>
        <Plus className="size-4" strokeWidth={2.5} />
        Add category
      </Button>
    </div>
  );
}

function EmptyCatalog() {
  const { loadStarterCatalog } = usePlanner();
  return (
    <div className="panel p-8 text-center">
      <div className="eyebrow">Get started</div>
      <h2 className="mt-2 font-display text-2xl font-extrabold">
        No categories yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-muted">
        Each block rotates through your categories — one per &ldquo;month.&rdquo;
        Load the starter catalog or build your own.
      </p>
      <div className="mt-5 flex flex-col items-center gap-2">
        <Button variant="primary" size="lg" onClick={loadStarterCatalog}>
          <Sparkles className="size-4" strokeWidth={2.5} />
          Load starter catalog
        </Button>
        <span className="text-xs font-semibold text-muted">
          Mockup Studio · Packaging · PSD &amp; EPS
        </span>
      </div>
    </div>
  );
}

export function CategoriesManager() {
  const { state } = usePlanner();
  const categories = [...state.categories].sort((a, b) => a.order - b.order);

  return (
    <div>
      <PageHeader eyebrow="Queues" title="Categories" />
      <p className="mb-5 max-w-2xl text-sm font-semibold text-muted">
        Each block pulls the next <b className="text-ink">unused</b> subcategory
        from the top of a category&apos;s queue. Blocks rotate through your
        categories in the order shown.
      </p>

      {categories.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col gap-5">
          <EmptyCatalog />
          <div className="flex items-center gap-3">
            <span className="h-0.5 flex-1 bg-ink/15" />
            <span className="eyebrow">or add your own</span>
            <span className="h-0.5 flex-1 bg-ink/15" />
          </div>
          <AddCategoryCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {categories.map((c, i) => (
            <CategoryCard
              key={c.id}
              category={c}
              index={i}
              total={categories.length}
            />
          ))}
          <AddCategoryCard />
        </div>
      )}
    </div>
  );
}
