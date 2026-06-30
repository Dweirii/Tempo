import { describe, it, expect } from "vitest";
import {
  upcomingSunday,
  addDays,
  diffDays,
  toISODate,
  parseISODate,
  monthGrid,
  isSameMonth,
} from "./dates";

describe("upcomingSunday", () => {
  it("returns a Sunday within the next 7 days", () => {
    const result = upcomingSunday(new Date(2026, 5, 29)); // Mon Jun 29 2026
    expect(parseISODate(result).getDay()).toBe(0);
    const delta = diffDays(result, "2026-06-29");
    expect(delta).toBeGreaterThanOrEqual(0);
    expect(delta).toBeLessThanOrEqual(6);
  });

  it("returns the same day when given a Sunday (on-or-after)", () => {
    const sunday = upcomingSunday(new Date(2026, 5, 29));
    const d = parseISODate(sunday);
    expect(upcomingSunday(d)).toBe(sunday);
  });
});

describe("addDays / diffDays", () => {
  it("adds and subtracts days symmetrically", () => {
    expect(addDays("2026-06-29", 7)).toBe("2026-07-06");
    expect(addDays("2026-06-29", -1)).toBe("2026-06-28");
    expect(diffDays("2026-07-06", "2026-06-29")).toBe(7);
  });

  it("crosses month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("toISODate / parseISODate roundtrip", () => {
  it("roundtrips a local date", () => {
    const d = new Date(2026, 11, 5);
    expect(toISODate(parseISODate(toISODate(d)))).toBe("2026-12-05");
  });
});

describe("monthGrid", () => {
  it("returns 42 days starting on a Sunday", () => {
    const grid = monthGrid("2026-06-15");
    expect(grid).toHaveLength(42);
    expect(parseISODate(grid[0]).getDay()).toBe(0);
  });

  it("contains the first day of the anchor month", () => {
    const grid = monthGrid("2026-06-15");
    expect(grid).toContain("2026-06-01");
    expect(grid.some((d) => isSameMonth(d, "2026-06-15"))).toBe(true);
  });
});
