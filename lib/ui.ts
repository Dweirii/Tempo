import type { Format, Owner, Status } from "./types";

// Solid sticker colors. Pills/badges render these as the background with a black
// border + black text (the Gumroad look). Kept as hex so they can drive inline
// styles anywhere (calendar cells, kanban accents, legends).

export const FORMAT_META: Record<Format, { label: string; bg: string }> = {
  Post: { label: "Post", bg: "#7AA2FF" },
  Reel: { label: "Reel", bg: "#C79BFF" },
  Story: { label: "Story", bg: "#7ED98C" },
  Custom: { label: "Custom", bg: "#FF9A52" },
};

export const STATUS_META: Record<Status, { label: string; bg: string }> = {
  Idea: { label: "Idea", bg: "#ECE7D6" },
  "In Design": { label: "In Design", bg: "#FFD84D" },
  Ready: { label: "Ready", bg: "#7AA2FF" },
  Scheduled: { label: "Scheduled", bg: "#C79BFF" },
  Posted: { label: "Posted", bg: "#7ED98C" },
};

export const OWNER_META: Record<Owner, { label: string; bg: string }> = {
  Design: { label: "Design", bg: "#FF90E8" },
  Social: { label: "Social", bg: "#90DDFF" },
  Video: { label: "Video", bg: "#FFC900" },
};

export const FORMATS: Format[] = ["Post", "Reel", "Story", "Custom"];
export const OWNERS: Owner[] = ["Design", "Social", "Video"];

// Palette offered when creating/editing a category.
export const CATEGORY_COLORS = [
  "#FF90E8",
  "#FFC900",
  "#90DDFF",
  "#C79BFF",
  "#7ED98C",
  "#FF9A52",
  "#FF6B6B",
  "#9BE15D",
];
