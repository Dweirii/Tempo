import { describe, it, expect } from "vitest";
import {
  seedState,
  pullSubcategories,
  planNextBlock,
  generateNextBlock,
  createInitialState,
} from "./engine";
import type { PlannerState, Subcategory } from "./types";
import { upcomingSunday, addDays } from "./dates";

const TODAY = new Date(2026, 5, 29); // Mon Jun 29 2026

function subsFor(state: PlannerState, slug: string): Subcategory[] {
  const cat = state.categories.find((c) => c.slug === slug)!;
  return state.subcategories
    .filter((s) => s.categoryId === cat.id)
    .sort((a, b) => a.order - b.order);
}

function gen(times: number): PlannerState {
  let state = seedState();
  for (let i = 0; i < times; i++) state = generateNextBlock(state, TODAY);
  return state;
}

describe("seedState", () => {
  it("creates 3 categories in rotation order", () => {
    const s = seedState();
    expect(s.categories.map((c) => c.slug)).toEqual([
      "mockup-studio",
      "packaging",
      "psd-eps",
    ]);
    expect(s.categories.map((c) => c.order)).toEqual([0, 1, 2]);
  });

  it("seeds the correct subcategory counts, all unused", () => {
    const s = seedState();
    expect(subsFor(s, "mockup-studio")).toHaveLength(26);
    expect(subsFor(s, "packaging")).toHaveLength(37);
    expect(subsFor(s, "psd-eps")).toHaveLength(10);
    expect(s.subcategories.every((x) => x.used === false)).toBe(true);
  });

  it("starts with no weeks or content", () => {
    const s = seedState();
    expect(s.weeks).toHaveLength(0);
    expect(s.contentItems).toHaveLength(0);
  });
});

describe("pullSubcategories", () => {
  const ten = (): Subcategory[] =>
    Array.from({ length: 10 }, (_, i) => ({
      id: `x-${i}`,
      categoryId: "c",
      name: `Sub ${i}`,
      used: false,
      order: i,
    }));

  it("pulls the first N unused by order", () => {
    const { picked, recycled } = pullSubcategories(ten(), 4);
    expect(picked.map((p) => p.order)).toEqual([0, 1, 2, 3]);
    expect(recycled).toBe(false);
  });

  it("skips used ones and pulls the next unused by order", () => {
    const subs = ten().map((s) => (s.order < 4 ? { ...s, used: true } : s));
    const { picked, recycled } = pullSubcategories(subs, 4);
    expect(picked.map((p) => p.order)).toEqual([4, 5, 6, 7]);
    expect(recycled).toBe(false);
  });

  it("recycles the queue when fewer than N remain unused", () => {
    const subs = ten().map((s) => (s.order < 8 ? { ...s, used: true } : s));
    const { picked, recycled } = pullSubcategories(subs, 4);
    expect(picked.map((p) => p.order)).toEqual([0, 1, 2, 3]);
    expect(recycled).toBe(true);
  });
});

describe("generateNextBlock — block 1 (Mockup Studio)", () => {
  const state = generateNextBlock(seedState(), TODAY);

  it("creates 4 weeks and 28 content items", () => {
    expect(state.weeks).toHaveLength(4);
    expect(state.contentItems).toHaveLength(28);
  });

  it("uses the Mockup Studio category for block 1", () => {
    const cat = state.categories.find((c) => c.slug === "mockup-studio")!;
    expect(state.weeks.every((w) => w.categoryId === cat.id)).toBe(true);
    expect(state.weeks.every((w) => w.blockNumber === 1)).toBe(true);
    expect(state.weeks.map((w) => w.weekNumber)).toEqual([1, 2, 3, 4]);
  });

  it("pulls the first 4 subcategories of the queue, in order", () => {
    const ordered = [...state.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    const names = ordered.map(
      (w) => state.subcategories.find((s) => s.id === w.subcategoryId)!.name,
    );
    expect(names).toEqual([
      "Alcohol & Beer Bottles",
      "Apparel & Clothing",
      "Bags & Packaging Boxes",
      "Beverage Cans",
    ]);
  });

  it("marks pulled subcategories used with their week id", () => {
    const used = state.subcategories.filter((s) => s.used);
    expect(used).toHaveLength(4);
    for (const w of state.weeks) {
      const sub = state.subcategories.find((s) => s.id === w.subcategoryId)!;
      expect(sub.used).toBe(true);
      expect(sub.usedInWeekId).toBe(w.id);
    }
    // the rest stay unused
    expect(state.subcategories.filter((s) => !s.used)).toHaveLength(26 + 37 + 10 - 4);
  });

  it("starts on the upcoming Sunday with consecutive weekly start dates", () => {
    const ordered = [...state.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    const start = upcomingSunday(TODAY);
    expect(ordered[0].startDate).toBe(start);
    expect(ordered[1].startDate).toBe(addDays(start, 7));
    expect(ordered[2].startDate).toBe(addDays(start, 14));
    expect(ordered[3].startDate).toBe(addDays(start, 21));
  });

  it("attaches a 7-day editable story rotation to each week", () => {
    for (const w of state.weeks) {
      expect(w.storyRotation).toHaveLength(7);
      expect(w.storyRotation[0]).toBe("Poll + repost");
      expect(w.storyRotation[6]).toBe("Custom-work BTS ×2");
    }
  });

  it("derives a default theme from the subcategory", () => {
    const ordered = [...state.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    expect(ordered[0].theme).toContain("Alcohol & Beer Bottles");
  });

  it("generates 7 cadence items per week with correct slots and formats", () => {
    const week1 = [...state.weeks].sort((a, b) => a.weekNumber - b.weekNumber)[0];
    const items = state.contentItems
      .filter((i) => i.weekId === week1.id)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    expect(items).toHaveLength(7);
    expect(items.map((i) => i.slot)).toEqual([
      "POST 1",
      "REEL 1",
      "POST 2",
      "REEL 2",
      "POST 3",
      "STORIES",
      "CUSTOM VIDEO",
    ]);
    expect(items.map((i) => i.format)).toEqual([
      "Post",
      "Reel",
      "Post",
      "Reel",
      "Post",
      "Story",
      "Custom",
    ]);
  });

  it("fills the {sub} placeholder and dates each item", () => {
    const week1 = [...state.weeks].sort((a, b) => a.weekNumber - b.weekNumber)[0];
    const items = state.contentItems
      .filter((i) => i.weekId === week1.id)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    expect(items[0].concept).toContain("Alcohol & Beer Bottles");
    expect(state.contentItems.some((i) => i.concept.includes("{sub}"))).toBe(false);
    expect(items[0].date).toBe(week1.startDate);
    expect(items[3].date).toBe(addDays(week1.startDate, 3));
    expect(items.every((i) => i.status === "Idea")).toBe(true);
  });

  it("gives every content item a unique id", () => {
    const ids = state.contentItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("generateNextBlock — rotation across blocks", () => {
  it("block 2 is Packaging, weeks 5–8, starting the Sunday after block 1", () => {
    const s = gen(2);
    const block2 = s.weeks.filter((w) => w.blockNumber === 2);
    const cat = s.categories.find((c) => c.slug === "packaging")!;
    expect(block2).toHaveLength(4);
    expect(block2.every((w) => w.categoryId === cat.id)).toBe(true);
    expect(block2.map((w) => w.weekNumber).sort((a, b) => a - b)).toEqual([5, 6, 7, 8]);

    const start = upcomingSunday(TODAY);
    const b2w1 = block2.sort((a, b) => a.weekNumber - b.weekNumber)[0];
    expect(b2w1.startDate).toBe(addDays(start, 28));
    const firstPackaging = s.subcategories.find((x) => x.id === b2w1.subcategoryId)!;
    expect(firstPackaging.name).toBe("Alcoholic Beverages");
  });

  it("block 3 is PSD & EPS", () => {
    const s = gen(3);
    const block3 = s.weeks.filter((w) => w.blockNumber === 3);
    const cat = s.categories.find((c) => c.slug === "psd-eps")!;
    expect(block3.every((w) => w.categoryId === cat.id)).toBe(true);
  });

  it("block 4 returns to Mockup Studio and pulls the NEXT 4 unused subs", () => {
    const s = gen(4);
    const block4 = s.weeks
      .filter((w) => w.blockNumber === 4)
      .sort((a, b) => a.weekNumber - b.weekNumber);
    const cat = s.categories.find((c) => c.slug === "mockup-studio")!;
    expect(block4.every((w) => w.categoryId === cat.id)).toBe(true);
    const names = block4.map(
      (w) => s.subcategories.find((x) => x.id === w.subcategoryId)!.name,
    );
    expect(names).toEqual([
      "Billboards & Outdoor Advertising",
      "Bottles - Other",
      "Business Cards",
      "Coffee Cups & Drinkware",
    ]);
  });
});

describe("planNextBlock (preview, no mutation)", () => {
  it("previews the next block without changing state", () => {
    const seed = seedState();
    const plan = planNextBlock(seed, TODAY);
    expect(plan.blockNumber).toBe(1);
    expect(plan.category.slug).toBe("mockup-studio");
    expect(plan.weeks).toHaveLength(4);
    expect(plan.weeks[0].subcategory.name).toBe("Alcohol & Beer Bottles");
    expect(plan.weeks[0].itemCount).toBe(7);
    // seed is untouched
    expect(seed.weeks).toHaveLength(0);
    expect(seed.subcategories.every((s) => !s.used)).toBe(true);
  });
});

describe("createInitialState", () => {
  it("seeds and auto-generates block 1", () => {
    const s = createInitialState(TODAY);
    expect(s.weeks).toHaveLength(4);
    expect(s.contentItems).toHaveLength(28);
    expect(s.weeks.every((w) => w.blockNumber === 1)).toBe(true);
  });
});
