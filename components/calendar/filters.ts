import type { ContentItem, Format, Owner, PlannerState, Status } from "@/lib/types";
import { weekById } from "@/lib/selectors";

export interface CalendarFilters {
  categoryId?: string;
  format?: Format;
  owner?: Owner;
  status?: Status;
}

export function itemPasses(
  state: PlannerState,
  item: ContentItem,
  f: CalendarFilters,
): boolean {
  if (f.format && item.format !== f.format) return false;
  if (f.owner && item.owner !== f.owner) return false;
  if (f.status && item.status !== f.status) return false;
  if (f.categoryId) {
    const w = weekById(state, item.weekId);
    if (!w || w.categoryId !== f.categoryId) return false;
  }
  return true;
}

export function activeFilterCount(f: CalendarFilters): number {
  return [f.categoryId, f.format, f.owner, f.status].filter(Boolean).length;
}
