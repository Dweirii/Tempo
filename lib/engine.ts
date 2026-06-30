// Rotation + generation engine — the core of the planner.
//
// Rules (from the spec):
//  - The calendar runs in 4-week blocks ("months").
//  - Block N's category rotates: Mockup Studio -> Packaging -> PSD & EPS -> repeat.
//  - Each of a block's 4 weeks takes the next unused subcategory from that
//    category's queue (by order). Pulled subcategories are marked used.
//  - Each week generates 7 content items from the fixed cadence template and an
//    editable 7-day story rotation.
//
// Every function here is pure: ids and dates are deterministic so the behaviour
// is fully testable. The store layer supplies `today` (new Date()).

import type {
  Category,
  ContentItem,
  PlannerState,
  Subcategory,
  Week,
} from "./types";
import { seedCategories, seedSubcategories } from "./seed";
import { CADENCE, STORY_ROTATION, fillConcept } from "./cadence";
import { addDays, upcomingSunday } from "./dates";

export const WEEKS_PER_BLOCK = 4;

export function seedState(): PlannerState {
  return {
    categories: seedCategories(),
    subcategories: seedSubcategories(),
    weeks: [],
    contentItems: [],
  };
}

export interface PulledSubcategories {
  picked: Subcategory[];
  recycled: boolean;
}

/**
 * Pull the next `count` subcategories from a category's queue, in order.
 * Skips ones already used. If fewer than `count` remain unused, the queue is
 * recycled (restarted from the top) and `recycled` is set so callers can reset
 * the used flags.
 */
export function pullSubcategories(
  subs: Subcategory[],
  count: number,
): PulledSubcategories {
  const ordered = [...subs].sort((a, b) => a.order - b.order);
  const unused = ordered.filter((s) => !s.used);
  if (unused.length >= count) {
    return { picked: unused.slice(0, count), recycled: false };
  }
  return { picked: ordered.slice(0, count), recycled: true };
}

export interface BlockPlanWeek {
  weekNumber: number;
  subcategory: Subcategory;
  theme: string;
  startDate: string;
  itemCount: number;
  storyCount: number;
}

export interface BlockPlan {
  blockNumber: number;
  category: Category;
  weeks: BlockPlanWeek[];
  recycled: boolean;
}

function defaultTheme(subName: string): string {
  return `${subName} Week`;
}

function orderedCategories(state: PlannerState): Category[] {
  return [...state.categories].sort((a, b) => a.order - b.order);
}

function nextBlockNumber(state: PlannerState): number {
  return state.weeks.reduce((m, w) => Math.max(m, w.blockNumber), 0) + 1;
}

function nextWeekNumber(state: PlannerState): number {
  return state.weeks.reduce((m, w) => Math.max(m, w.weekNumber), 0) + 1;
}

function nextStartDate(state: PlannerState, today: Date): string {
  if (state.weeks.length === 0) return upcomingSunday(today);
  const last = state.weeks.reduce(
    (acc, w) => (w.startDate > acc ? w.startDate : acc),
    state.weeks[0].startDate,
  );
  return addDays(last, 7);
}

/** Preview the next block without mutating state (used by the confirm modal). */
export function planNextBlock(state: PlannerState, today: Date): BlockPlan {
  const cats = orderedCategories(state);
  if (cats.length === 0) throw new Error("No categories seeded");

  const blockNumber = nextBlockNumber(state);
  const category = cats[(blockNumber - 1) % cats.length];
  const catSubs = state.subcategories.filter((s) => s.categoryId === category.id);
  const { picked, recycled } = pullSubcategories(catSubs, WEEKS_PER_BLOCK);

  const startWeekNumber = nextWeekNumber(state);
  const blockStart = nextStartDate(state, today);

  const weeks: BlockPlanWeek[] = picked.map((sub, i) => ({
    weekNumber: startWeekNumber + i,
    subcategory: sub,
    theme: defaultTheme(sub.name),
    startDate: addDays(blockStart, i * 7),
    itemCount: CADENCE.length,
    storyCount: STORY_ROTATION.length,
  }));

  return { blockNumber, category, weeks, recycled };
}

/** Generate the next block and return a new immutable PlannerState. */
export function generateNextBlock(state: PlannerState, today: Date): PlannerState {
  const plan = planNextBlock(state, today);

  const newWeeks: Week[] = [];
  const newItems: ContentItem[] = [];
  const usedUpdates = new Map<string, string>(); // subcategoryId -> weekId

  plan.weeks.forEach((pw, i) => {
    const weekId = `week-${plan.blockNumber}-${i + 1}`;
    newWeeks.push({
      id: weekId,
      weekNumber: pw.weekNumber,
      blockNumber: plan.blockNumber,
      categoryId: plan.category.id,
      subcategoryId: pw.subcategory.id,
      theme: pw.theme,
      startDate: pw.startDate,
      storyRotation: [...STORY_ROTATION],
    });
    usedUpdates.set(pw.subcategory.id, weekId);

    for (const row of CADENCE) {
      newItems.push({
        id: `${weekId}-${row.dayOfWeek}`,
        weekId,
        date: addDays(pw.startDate, row.dayOfWeek),
        dayOfWeek: row.dayOfWeek,
        slot: row.slot,
        format: row.format,
        concept: fillConcept(row.concept, pw.subcategory.name),
        caption: "",
        hashtags: "",
        assetUrl: "",
        trendingAudio: "",
        productSku: "",
        owner: row.owner,
        assignee: "",
        status: "Idea",
      });
    }
  });

  const pickedIds = new Set(plan.weeks.map((w) => w.subcategory.id));
  const subcategories = state.subcategories.map((s) => {
    // On a recycle, reset the whole category queue, then re-apply this block's picks.
    if (plan.recycled && s.categoryId === plan.category.id) {
      return pickedIds.has(s.id)
        ? { ...s, used: true, usedInWeekId: usedUpdates.get(s.id) }
        : { ...s, used: false, usedInWeekId: undefined };
    }
    if (usedUpdates.has(s.id)) {
      return { ...s, used: true, usedInWeekId: usedUpdates.get(s.id) };
    }
    return s;
  });

  return {
    categories: state.categories,
    subcategories,
    weeks: [...state.weeks, ...newWeeks],
    contentItems: [...state.contentItems, ...newItems],
  };
}

/** First-run state: seed the catalogue and auto-generate Block 1. */
export function createInitialState(today: Date): PlannerState {
  return generateNextBlock(seedState(), today);
}
