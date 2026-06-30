// Core domain model for the Brandex Studio Planner.
// See AGENTS.md / project spec: month = 4-week block focused on one category,
// each week inside the block focuses on one subcategory.

export type CategorySlug = "mockup-studio" | "packaging" | "psd-eps";

export type Slot =
  | "POST 1"
  | "REEL 1"
  | "POST 2"
  | "REEL 2"
  | "POST 3"
  | "STORIES"
  | "CUSTOM VIDEO";

export type Format = "Post" | "Reel" | "Story" | "Custom";

export type Owner = "Design" | "Social" | "Video";

export const STATUSES = [
  "Idea",
  "In Design",
  "Ready",
  "Scheduled",
  "Posted",
] as const;
export type Status = (typeof STATUSES)[number];

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  order: number;
  productCount: number;
  color: string; // hex, used for badges/accents
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  used: boolean;
  usedInWeekId?: string;
  order: number;
}

export interface Week {
  id: string;
  weekNumber: number; // global, 1-indexed across the whole calendar
  blockNumber: number; // 1-indexed "month"
  categoryId: string;
  subcategoryId: string;
  theme: string; // editable headline, default derived from subcategory
  startDate: string; // ISO yyyy-mm-dd, always a Sunday
  storyRotation: string[]; // length 7, index 0=Sun .. 6=Sat — editable
}

export interface ContentItem {
  id: string;
  weekId: string;
  date: string; // ISO yyyy-mm-dd
  dayOfWeek: number; // 0=Sun .. 6=Sat
  slot: Slot;
  format: Format;
  concept: string;
  caption: string;
  hashtags: string;
  assetUrl: string;
  trendingAudio: string;
  productSku: string;
  owner: Owner;
  assignee: string;
  status: Status;
}

export interface PlannerState {
  categories: Category[];
  subcategories: Subcategory[];
  weeks: Week[];
  contentItems: ContentItem[];
}

// Image bytes are never loaded into client state — only this light metadata is.
// Thumbnails are fetched lazily from /api/assets/[id].
export interface AssetMeta {
  id: string;
  contentItemId: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
}
