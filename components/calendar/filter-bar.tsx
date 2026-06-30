"use client";

import { X } from "lucide-react";
import type { Category } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { FORMATS, OWNERS, FORMAT_META, OWNER_META, STATUS_META } from "@/lib/ui";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CalendarFilters } from "./filters";
import { activeFilterCount } from "./filters";

const ALL = "all";

export function FilterBar({
  filters,
  onChange,
  categories,
}: {
  filters: CalendarFilters;
  onChange: (f: CalendarFilters) => void;
  categories: Category[];
}) {
  const set = (patch: Partial<CalendarFilters>) =>
    onChange({ ...filters, ...patch });
  const pick = (v: string) => (v === ALL ? undefined : v);
  const count = activeFilterCount(filters);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-1 hidden sm:inline">Filter</span>

      <Select
        ariaLabel="Filter by category"
        className="h-9 w-auto min-w-[150px] py-1.5"
        value={filters.categoryId ?? ALL}
        onValueChange={(v) => set({ categoryId: pick(v) })}
        options={[
          { value: ALL, label: "All categories" },
          ...categories.map((c) => ({
            value: c.id,
            label: c.name,
            color: c.color,
          })),
        ]}
      />

      <Select
        ariaLabel="Filter by format"
        className="h-9 w-auto min-w-[120px] py-1.5"
        value={filters.format ?? ALL}
        onValueChange={(v) => set({ format: pick(v) as CalendarFilters["format"] })}
        options={[
          { value: ALL, label: "All formats" },
          ...FORMATS.map((f) => ({
            value: f,
            label: f,
            color: FORMAT_META[f].bg,
          })),
        ]}
      />

      <Select
        ariaLabel="Filter by owner"
        className="h-9 w-auto min-w-[110px] py-1.5"
        value={filters.owner ?? ALL}
        onValueChange={(v) => set({ owner: pick(v) as CalendarFilters["owner"] })}
        options={[
          { value: ALL, label: "All owners" },
          ...OWNERS.map((o) => ({
            value: o,
            label: o,
            color: OWNER_META[o].bg,
          })),
        ]}
      />

      <Select
        ariaLabel="Filter by status"
        className="h-9 w-auto min-w-[120px] py-1.5"
        value={filters.status ?? ALL}
        onValueChange={(v) => set({ status: pick(v) as CalendarFilters["status"] })}
        options={[
          { value: ALL, label: "All statuses" },
          ...STATUSES.map((s) => ({
            value: s,
            label: s,
            color: STATUS_META[s].bg,
          })),
        ]}
      />

      <button
        type="button"
        onClick={() => onChange({})}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg border-2 px-2.5 text-xs font-bold transition-all",
          count
            ? "border-ink bg-white shadow-hard-sm push"
            : "pointer-events-none border-transparent text-muted opacity-0",
        )}
      >
        <X className="size-3.5" />
        Clear {count ? `(${count})` : ""}
      </button>
    </div>
  );
}
