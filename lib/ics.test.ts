import { describe, it, expect } from "vitest";
import { buildICS, escapeICS, foldLine, type IcsEvent } from "./ics";

const NOW = new Date(Date.UTC(2026, 5, 29, 12, 0, 0));

describe("escapeICS", () => {
  it("escapes commas, semicolons, backslashes and newlines", () => {
    expect(escapeICS("a, b; c\\ d\ne")).toBe("a\\, b\\; c\\\\ d\\ne");
  });
});

describe("foldLine", () => {
  it("leaves short lines untouched", () => {
    expect(foldLine("SUMMARY:hello")).toBe("SUMMARY:hello");
  });
  it("folds long lines with a leading space on continuations", () => {
    const folded = foldLine("X".repeat(200));
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts[1].startsWith(" ")).toBe(true);
  });
});

describe("buildICS", () => {
  const events: IcsEvent[] = [
    {
      uid: "week-1-1-0@brandex",
      date: "2026-07-05",
      summary: "POST 1 · Apparel & Clothing",
      description: "Hero showcase, swipe to see range",
      categories: "Post",
    },
  ];

  it("wraps events in a VCALENDAR with CRLF line endings", () => {
    const ics = buildICS(events, NOW);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
  });

  it("emits an all-day VEVENT with DTSTART and exclusive DTEND", () => {
    const ics = buildICS(events, NOW);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:week-1-1-0@brandex");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260705");
    expect(ics).toContain("DTEND;VALUE=DATE:20260706");
    expect(ics).toContain("DTSTAMP:20260629T120000Z");
  });

  it("escapes special characters in text fields", () => {
    const ics = buildICS(events, NOW);
    expect(ics).toContain("DESCRIPTION:Hero showcase\\, swipe to see range");
  });
});
