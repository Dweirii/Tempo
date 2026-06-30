// Minimal RFC 5545 iCalendar builder for all-day content events.
import { addDays } from "./dates";

export interface IcsEvent {
  uid: string;
  date: string; // yyyy-mm-dd (all-day)
  summary: string;
  description?: string;
  categories?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC timestamp: yyyymmddThhmmssZ */
function stamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function compact(iso: string): string {
  return iso.replace(/-/g, "");
}

export function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold long content lines per RFC 5545 (75 octets; continuations start w/ space). */
export function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const out: string[] = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) {
    out.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest.length) out.push(" " + rest);
  return out.join("\r\n");
}

export function buildICS(
  events: IcsEvent[],
  now: Date,
  calName = "Brandex Studio Planner",
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Brandex//Studio Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeICS(calName)}`),
  ];

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${stamp(now)}`);
    lines.push(`DTSTART;VALUE=DATE:${compact(e.date)}`);
    lines.push(`DTEND;VALUE=DATE:${compact(addDays(e.date, 1))}`);
    lines.push(foldLine(`SUMMARY:${escapeICS(e.summary)}`));
    if (e.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeICS(e.description)}`));
    }
    if (e.categories) {
      lines.push(foldLine(`CATEGORIES:${escapeICS(e.categories)}`));
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
