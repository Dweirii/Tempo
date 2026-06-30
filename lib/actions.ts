"use server";

// Server actions = the data layer. The generation engine runs here so it stays
// the single source of truth across all users. Simple field edits update one
// row; generation/seed/reset run the pure engine then persist the delta.

import { randomUUID } from "node:crypto";
import { prisma } from "./db";
import type {
  AssetMeta,
  Category,
  CategorySlug,
  ContentItem,
  Format,
  Owner,
  PlannerState,
  Slot,
  Status,
  Subcategory,
  Week,
} from "./types";
import { createInitialState, generateNextBlock } from "./engine";

// ── row → domain mappers (internal; non-exported) ──────────────────────────
type Row = Record<string, unknown>;

function mapCategory(c: Row): Category {
  return {
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as CategorySlug,
    order: c.order as number,
    productCount: c.productCount as number,
    color: c.color as string,
  };
}
function mapSub(s: Row): Subcategory {
  return {
    id: s.id as string,
    categoryId: s.categoryId as string,
    name: s.name as string,
    used: s.used as boolean,
    usedInWeekId: (s.usedInWeekId as string | null) ?? undefined,
    order: s.order as number,
  };
}
function mapWeek(w: Row): Week {
  return {
    id: w.id as string,
    weekNumber: w.weekNumber as number,
    blockNumber: w.blockNumber as number,
    categoryId: w.categoryId as string,
    subcategoryId: w.subcategoryId as string,
    theme: w.theme as string,
    startDate: w.startDate as string,
    storyRotation: Array.isArray(w.storyRotation)
      ? (w.storyRotation as string[])
      : [],
  };
}
function mapItem(i: Row): ContentItem {
  return {
    id: i.id as string,
    weekId: i.weekId as string,
    date: i.date as string,
    dayOfWeek: i.dayOfWeek as number,
    slot: i.slot as Slot,
    format: i.format as Format,
    concept: i.concept as string,
    caption: i.caption as string,
    hashtags: i.hashtags as string,
    assetUrl: i.assetUrl as string,
    trendingAudio: i.trendingAudio as string,
    productSku: i.productSku as string,
    owner: i.owner as Owner,
    assignee: i.assignee as string,
    status: i.status as Status,
  };
}

function weekRow(w: Week) {
  return {
    id: w.id,
    weekNumber: w.weekNumber,
    blockNumber: w.blockNumber,
    categoryId: w.categoryId,
    subcategoryId: w.subcategoryId,
    theme: w.theme,
    startDate: w.startDate,
    storyRotation: w.storyRotation,
  };
}
function subRow(s: Subcategory) {
  return {
    id: s.id,
    categoryId: s.categoryId,
    name: s.name,
    used: s.used,
    usedInWeekId: s.usedInWeekId ?? null,
    order: s.order,
  };
}

async function readState(): Promise<PlannerState> {
  const [categories, subs, weeks, items] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.subcategory.findMany({ orderBy: { order: "asc" } }),
    prisma.week.findMany({ orderBy: { weekNumber: "asc" } }),
    prisma.contentItem.findMany(),
  ]);
  return {
    categories: categories.map(mapCategory),
    subcategories: subs.map(mapSub),
    weeks: weeks.map(mapWeek),
    contentItems: items.map(mapItem),
  };
}

async function persistFresh(s: PlannerState): Promise<void> {
  await prisma.$transaction([
    prisma.category.createMany({ data: s.categories }),
    prisma.subcategory.createMany({ data: s.subcategories.map(subRow) }),
    prisma.week.createMany({ data: s.weeks.map(weekRow) }),
    prisma.contentItem.createMany({ data: s.contentItems }),
  ]);
}

// ── exported server actions ────────────────────────────────────────────────

/** Initial load: seed + auto-generate Block 1 on first run, else read all. */
export async function loadPlanner(): Promise<PlannerState> {
  const count = await prisma.category.count();
  if (count === 0) {
    const initial = createInitialState(new Date());
    await persistFresh(initial);
    return initial;
  }
  return readState();
}

export async function refreshPlanner(): Promise<PlannerState> {
  return readState();
}

/** Run the rotation engine server-side and persist only the new rows/updates. */
export async function generateNextBlockAction(): Promise<PlannerState> {
  const current = await readState();
  const next = generateNextBlock(current, new Date());

  const oldWeeks = new Set(current.weeks.map((w) => w.id));
  const newWeeks = next.weeks.filter((w) => !oldWeeks.has(w.id));
  const oldItems = new Set(current.contentItems.map((i) => i.id));
  const newItems = next.contentItems.filter((i) => !oldItems.has(i.id));

  const oldSub = new Map(current.subcategories.map((s) => [s.id, s]));
  const changedSubs = next.subcategories.filter((s) => {
    const o = oldSub.get(s.id);
    return (
      !o ||
      o.used !== s.used ||
      (o.usedInWeekId ?? null) !== (s.usedInWeekId ?? null)
    );
  });

  await prisma.$transaction([
    prisma.week.createMany({ data: newWeeks.map(weekRow) }),
    prisma.contentItem.createMany({ data: newItems }),
    ...changedSubs.map((s) =>
      prisma.subcategory.update({
        where: { id: s.id },
        data: { used: s.used, usedInWeekId: s.usedInWeekId ?? null },
      }),
    ),
  ]);

  return next;
}

export async function updateItemAction(
  id: string,
  patch: Partial<ContentItem>,
): Promise<void> {
  // id/weekId are managed separately (see moveItemAction); everything else is a
  // plain editable scalar. Undefined fields are ignored by Prisma.
  const { id: _id, weekId: _weekId, ...data } = patch;
  if (Object.keys(data).length === 0) return;
  await prisma.contentItem.update({ where: { id }, data });
}

export async function moveItemAction(
  id: string,
  date: string,
  dayOfWeek: number,
  weekId: string,
): Promise<void> {
  await prisma.contentItem.update({
    where: { id },
    data: { date, dayOfWeek, weekId },
  });
}

export async function setStatusAction(
  id: string,
  status: Status,
): Promise<void> {
  await prisma.contentItem.update({ where: { id }, data: { status } });
}

export async function updateWeekAction(
  id: string,
  patch: { theme?: string; storyRotation?: string[] },
): Promise<void> {
  const data: { theme?: string; storyRotation?: string[] } = {};
  if (patch.theme !== undefined) data.theme = patch.theme;
  if (patch.storyRotation !== undefined) data.storyRotation = patch.storyRotation;
  if (Object.keys(data).length === 0) return;
  await prisma.week.update({ where: { id }, data });
}

export async function addSubcategoryAction(
  categoryId: string,
  name: string,
): Promise<Subcategory> {
  const agg = await prisma.subcategory.aggregate({
    where: { categoryId },
    _max: { order: true },
  });
  const order = (agg._max.order ?? -1) + 1;
  const row = await prisma.subcategory.create({
    data: {
      id: `sub-custom-${randomUUID()}`,
      categoryId,
      name,
      used: false,
      order,
    },
  });
  return mapSub(row);
}

export async function toggleSubUsedAction(id: string): Promise<void> {
  const sub = await prisma.subcategory.findUnique({ where: { id } });
  if (!sub) return;
  await prisma.subcategory.update({
    where: { id },
    data: {
      used: !sub.used,
      usedInWeekId: !sub.used ? sub.usedInWeekId : null,
    },
  });
}

export async function reorderSubcategoriesAction(
  orderedIds: string[],
): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.subcategory.update({ where: { id }, data: { order: i } }),
    ),
  );
}

// ── assets (image bytes live in the DB; only metadata is returned) ──────────
const ASSET_SELECT = {
  id: true,
  contentItemId: true,
  filename: true,
  mimeType: true,
  width: true,
  height: true,
} as const;

export async function loadAssets(): Promise<AssetMeta[]> {
  return prisma.asset.findMany({
    select: ASSET_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

export async function uploadAssetAction(
  contentItemId: string,
  payload: {
    filename: string;
    mimeType: string;
    dataBase64: string;
    width: number;
    height: number;
  },
): Promise<AssetMeta> {
  return prisma.asset.create({
    data: {
      id: `asset-${randomUUID()}`,
      contentItemId,
      filename: payload.filename,
      mimeType: payload.mimeType,
      data: Buffer.from(payload.dataBase64, "base64"),
      width: payload.width,
      height: payload.height,
    },
    select: ASSET_SELECT,
  });
}

export async function deleteAssetAction(id: string): Promise<void> {
  await prisma.asset.delete({ where: { id } });
}

export async function resetAllAction(): Promise<PlannerState> {
  await prisma.$transaction([
    prisma.contentItem.deleteMany(),
    prisma.week.deleteMany(),
    prisma.subcategory.deleteMany(),
    prisma.category.deleteMany(),
  ]);
  const initial = createInitialState(new Date());
  await persistFresh(initial);
  return initial;
}
