import type {
  Category,
  ContentItem,
  PlannerState,
  Status,
  Subcategory,
  Week,
} from "./types";
import { STATUSES } from "./types";
import { addDays } from "./dates";
import { CADENCE } from "./cadence";

const SLOT_ORDER = new Map(CADENCE.map((c, i) => [c.slot, i]));

export function weekById(state: PlannerState, id: string): Week | undefined {
  return state.weeks.find((w) => w.id === id);
}

export function categoryById(
  state: PlannerState,
  id: string,
): Category | undefined {
  return state.categories.find((c) => c.id === id);
}

export function subcategoryById(
  state: PlannerState,
  id: string,
): Subcategory | undefined {
  return state.subcategories.find((s) => s.id === id);
}

/** Content items on a given date, ordered by cadence slot. */
export function itemsForDate(state: PlannerState, date: string): ContentItem[] {
  return state.contentItems
    .filter((i) => i.date === date)
    .sort(
      (a, b) =>
        (SLOT_ORDER.get(a.slot) ?? 99) - (SLOT_ORDER.get(b.slot) ?? 99),
    );
}

export function weekForDate(
  state: PlannerState,
  date: string,
): Week | undefined {
  return state.weeks.find(
    (w) => date >= w.startDate && date <= addDays(w.startDate, 6),
  );
}

/** Week containing `today`; else the next upcoming week; else the most recent. */
export function currentWeek(
  state: PlannerState,
  today: string,
): Week | undefined {
  const containing = weekForDate(state, today);
  if (containing) return containing;
  const future = state.weeks
    .filter((w) => w.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (future.length) return future[0];
  return [...state.weeks].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  )[0];
}

export interface WeekCounts {
  posts: number;
  reels: number;
  stories: number;
  custom: number;
}

/**
 * Counts for a week. posts/reels/custom come from content-item formats; stories
 * reflect the daily story-rotation plan (target 7–12/week), not the lone Friday
 * "Stories" content item.
 */
export function weekCounts(state: PlannerState, weekId: string): WeekCounts {
  const items = state.contentItems.filter((i) => i.weekId === weekId);
  const week = weekById(state, weekId);
  return {
    posts: items.filter((i) => i.format === "Post").length,
    reels: items.filter((i) => i.format === "Reel").length,
    custom: items.filter((i) => i.format === "Custom").length,
    stories: week ? week.storyRotation.filter((s) => s.trim()).length : 0,
  };
}

export function statusCounts(items: ContentItem[]): Record<Status, number> {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
    Status,
    number
  >;
  for (const i of items) counts[i.status]++;
  return counts;
}

/** Not-yet-posted items dated within [today, today+days], soonest first. */
export function dueSoon(
  state: PlannerState,
  today: string,
  days: number,
): ContentItem[] {
  const end = addDays(today, days);
  return state.contentItems
    .filter(
      (i) => i.status !== "Posted" && i.date >= today && i.date <= end,
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (SLOT_ORDER.get(a.slot) ?? 99) - (SLOT_ORDER.get(b.slot) ?? 99),
    );
}
