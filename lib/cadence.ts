import type { Slot, Format, Owner } from "./types";

// Fixed weekly cadence template. Weeks start Sunday (index 0).
// Owner defaults follow the format: Posts -> Design, Reels/Custom -> Video,
// Stories -> Social.
export interface CadenceRow {
  dayOfWeek: number; // 0=Sun .. 6=Sat
  slot: Slot;
  format: Format;
  owner: Owner;
  concept: string; // {sub} placeholder filled with the subcategory name
}

export const CADENCE: CadenceRow[] = [
  {
    dayOfWeek: 0,
    slot: "POST 1",
    format: "Post",
    owner: "Design",
    concept:
      "Hero showcase — single best {sub} asset, caption + use case, CTA link in bio",
  },
  {
    dayOfWeek: 1,
    slot: "REEL 1",
    format: "Reel",
    owner: "Video",
    concept:
      "How-to — screen-record swapping a smart object on a {sub} file, before→after, 15–25s",
  },
  {
    dayOfWeek: 2,
    slot: "POST 2",
    format: "Post",
    owner: "Design",
    concept:
      'Carousel — 5–7 slides of top {sub} options, "swipe to see the range", CTA save',
  },
  {
    dayOfWeek: 3,
    slot: "REEL 2",
    format: "Reel",
    owner: "Video",
    concept:
      "Satisfying reveal — fast cuts of {sub} results to trending audio, 7–15s",
  },
  {
    dayOfWeek: 4,
    slot: "POST 3",
    format: "Post",
    owner: "Design",
    concept:
      "Value/CTA — {sub} bundle or new-drop, direct link + design tip, CTA shop",
  },
  {
    dayOfWeek: 5,
    slot: "STORIES",
    format: "Story",
    owner: "Social",
    concept: "UGC/testimonial repost + link sticker",
  },
  {
    dayOfWeek: 6,
    slot: "CUSTOM VIDEO",
    format: "Custom",
    owner: "Video",
    concept: "Custom work shoot — bespoke {sub} client piece BTS + 2 stories",
  },
];

// Story rotation auto-attached to each week (editable). Index 0=Sun .. 6=Sat.
export const STORY_ROTATION: string[] = [
  "Poll + repost", // Sun
  "BTS clip", // Mon
  "Carousel teaser + countdown", // Tue
  "Reel teaser + question", // Wed
  "Bundle link", // Thu
  "UGC / testimonial", // Fri
  "Custom-work BTS ×2", // Sat
];

export function fillConcept(template: string, sub: string): string {
  return template.replaceAll("{sub}", sub);
}
