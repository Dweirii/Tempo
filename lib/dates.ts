// All calendar math uses local-time yyyy-mm-dd strings to avoid timezone drift.

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const MONTH_ABBR = MONTH_NAMES.map((m) => m.slice(0, 3));

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function diffDays(a: string, b: string): number {
  const ms = parseISODate(a).getTime() - parseISODate(b).getTime();
  return Math.round(ms / 86_400_000);
}

/** The upcoming Sunday on-or-after `from` (today, if today is Sunday). */
export function upcomingSunday(from: Date): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const dow = d.getDay(); // 0 = Sunday
  if (dow !== 0) d.setDate(d.getDate() + (7 - dow));
  return toISODate(d);
}

/** Sunday that starts the week containing `s`. */
export function startOfWeek(s: string): string {
  const d = parseISODate(s);
  return addDays(s, -d.getDay());
}

export function dayOfWeek(s: string): number {
  return parseISODate(s).getDay();
}

/** e.g. "Sun, Jun 29" */
export function formatDayLabel(s: string): string {
  const d = parseISODate(s);
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
}

/** e.g. "Jun 29 – Jul 5" for a week starting at `sunday`. */
export function formatWeekRange(sunday: string): string {
  const end = addDays(sunday, 6);
  const a = parseISODate(sunday);
  const b = parseISODate(end);
  const left = `${MONTH_ABBR[a.getMonth()]} ${a.getDate()}`;
  const right =
    a.getMonth() === b.getMonth()
      ? `${b.getDate()}`
      : `${MONTH_ABBR[b.getMonth()]} ${b.getDate()}`;
  return `${left} – ${right}`;
}

/** Grid of 6 weeks (42 cells) covering the month that contains `monthAnchor`. */
export function monthGrid(monthAnchor: string): string[] {
  const d = parseISODate(monthAnchor);
  const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const gridStart = addDays(toISODate(firstOfMonth), -firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function isSameMonth(a: string, b: string): boolean {
  const da = parseISODate(a);
  const db = parseISODate(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
}

export function monthTitle(s: string): string {
  const d = parseISODate(s);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
