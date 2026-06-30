"use server";

// Server actions = the data layer, scoped to the active Clerk organization.
// The org comes from the session (never the client). With Clerk off, everything
// lives under a single "default" org so the app still runs open. The generation
// engine runs here so it stays the single source of truth per org.

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { clerkEnabled } from "./auth";
import { uploadToBunny, deleteFromBunny } from "./bunny";
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
import { generateNextBlock } from "./engine";
import { seedCategories, seedSubcategories } from "./seed";

async function activeOrgId(): Promise<string> {
  if (!clerkEnabled) return "default";
  const { orgId } = await auth();
  if (!orgId) throw new Error("NO_ACTIVE_ORG");
  return orgId;
}

// compound primary key (orgId, id)
const pk = (orgId: string, id: string) => ({ orgId_id: { orgId, id } });

// ── row → domain mappers (orgId is dropped; domain types are org-free) ──────
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

function weekRow(w: Week, orgId: string) {
  return {
    orgId,
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
function subRow(s: Subcategory, orgId: string) {
  return {
    orgId,
    id: s.id,
    categoryId: s.categoryId,
    name: s.name,
    used: s.used,
    usedInWeekId: s.usedInWeekId ?? null,
    order: s.order,
  };
}

async function readState(orgId: string): Promise<PlannerState> {
  const [categories, subs, weeks, items] = await Promise.all([
    prisma.category.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
    prisma.subcategory.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
    prisma.week.findMany({ where: { orgId }, orderBy: { weekNumber: "asc" } }),
    prisma.contentItem.findMany({ where: { orgId } }),
  ]);
  return {
    categories: categories.map(mapCategory),
    subcategories: subs.map(mapSub),
    weeks: weeks.map(mapWeek),
    contentItems: items.map(mapItem),
  };
}

// ── exported server actions ────────────────────────────────────────────────

/** Load this org's planner. New orgs start empty (no auto-seed) — they pick a
 *  starter catalog or add their own categories. */
export async function loadPlanner(): Promise<PlannerState> {
  return readState(await activeOrgId());
}

/** One-click: drop the starter catalog (Mockup / Packaging / PSD) into an empty
 *  org. No-op if categories already exist. */
export async function loadStarterCatalogAction(): Promise<PlannerState> {
  const orgId = await activeOrgId();
  const count = await prisma.category.count({ where: { orgId } });
  if (count === 0) {
    await prisma.$transaction([
      prisma.category.createMany({
        data: seedCategories().map((c) => ({ ...c, orgId })),
      }),
      prisma.subcategory.createMany({
        data: seedSubcategories().map((s) => subRow(s, orgId)),
      }),
    ]);
  }
  return readState(orgId);
}

export async function refreshPlanner(): Promise<PlannerState> {
  return readState(await activeOrgId());
}

/** Run the rotation engine server-side and persist only the new rows/updates. */
export async function generateNextBlockAction(): Promise<PlannerState> {
  const orgId = await activeOrgId();
  const current = await readState(orgId);
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
    prisma.week.createMany({ data: newWeeks.map((w) => weekRow(w, orgId)) }),
    prisma.contentItem.createMany({
      data: newItems.map((i) => ({ ...i, orgId })),
    }),
    ...changedSubs.map((s) =>
      prisma.subcategory.update({
        where: pk(orgId, s.id),
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
  const orgId = await activeOrgId();
  const { id: _id, weekId: _weekId, ...data } = patch;
  if (Object.keys(data).length === 0) return;
  await prisma.contentItem.update({ where: pk(orgId, id), data });
}

export async function moveItemAction(
  id: string,
  date: string,
  dayOfWeek: number,
  weekId: string,
): Promise<void> {
  const orgId = await activeOrgId();
  await prisma.contentItem.update({
    where: pk(orgId, id),
    data: { date, dayOfWeek, weekId },
  });
}

export async function setStatusAction(
  id: string,
  status: Status,
): Promise<void> {
  const orgId = await activeOrgId();
  await prisma.contentItem.update({ where: pk(orgId, id), data: { status } });
}

export async function updateWeekAction(
  id: string,
  patch: { theme?: string; storyRotation?: string[] },
): Promise<void> {
  const orgId = await activeOrgId();
  const data: { theme?: string; storyRotation?: string[] } = {};
  if (patch.theme !== undefined) data.theme = patch.theme;
  if (patch.storyRotation !== undefined) data.storyRotation = patch.storyRotation;
  if (Object.keys(data).length === 0) return;
  await prisma.week.update({ where: pk(orgId, id), data });
}

export async function addSubcategoryAction(
  categoryId: string,
  name: string,
): Promise<Subcategory> {
  const orgId = await activeOrgId();
  const agg = await prisma.subcategory.aggregate({
    where: { orgId, categoryId },
    _max: { order: true },
  });
  const order = (agg._max.order ?? -1) + 1;
  const row = await prisma.subcategory.create({
    data: { orgId, id: `sub-custom-${randomUUID()}`, categoryId, name, used: false, order },
  });
  return mapSub(row);
}

export async function toggleSubUsedAction(id: string): Promise<void> {
  const orgId = await activeOrgId();
  const sub = await prisma.subcategory.findUnique({ where: pk(orgId, id) });
  if (!sub) return;
  await prisma.subcategory.update({
    where: pk(orgId, id),
    data: { used: !sub.used, usedInWeekId: !sub.used ? sub.usedInWeekId : null },
  });
}

export async function reorderSubcategoriesAction(
  orderedIds: string[],
): Promise<void> {
  const orgId = await activeOrgId();
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.subcategory.update({ where: pk(orgId, id), data: { order: i } }),
    ),
  );
}

// ── categories (user-managed per org) ──────────────────────────────────────

export async function addCategoryAction(
  name: string,
  color: string,
): Promise<Category> {
  const orgId = await activeOrgId();
  const agg = await prisma.category.aggregate({
    where: { orgId },
    _max: { order: true },
  });
  const order = (agg._max.order ?? -1) + 1;
  const id = `cat-${randomUUID()}`;
  const row = await prisma.category.create({
    data: { orgId, id, name, slug: id, order, productCount: 0, color },
  });
  return mapCategory(row);
}

export async function updateCategoryAction(
  id: string,
  patch: { name?: string; color?: string },
): Promise<void> {
  const orgId = await activeOrgId();
  const data: { name?: string; color?: string } = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.color !== undefined) data.color = patch.color;
  if (Object.keys(data).length === 0) return;
  await prisma.category.update({ where: pk(orgId, id), data });
}

/** Deletes the category and (cascade) its subcategories, weeks, content + assets. */
export async function deleteCategoryAction(id: string): Promise<void> {
  const orgId = await activeOrgId();
  await prisma.category.delete({ where: pk(orgId, id) });
}

export async function reorderCategoriesAction(
  orderedIds: string[],
): Promise<void> {
  const orgId = await activeOrgId();
  await prisma.$transaction(
    orderedIds.map((cid, i) =>
      prisma.category.update({ where: pk(orgId, cid), data: { order: i } }),
    ),
  );
}

// ── assets (image bytes live in the DB; only metadata is returned) ──────────
const ASSET_SELECT = {
  id: true,
  contentItemId: true,
  filename: true,
  mimeType: true,
  url: true,
  width: true,
  height: true,
} as const;

function extFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export async function loadAssets(): Promise<AssetMeta[]> {
  const orgId = await activeOrgId();
  return prisma.asset.findMany({
    where: { orgId },
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
  const orgId = await activeOrgId();
  const id = `asset-${randomUUID()}`;
  const path = `assets/${orgId}/${id}.${extFor(payload.mimeType)}`;
  const bytes = new Uint8Array(Buffer.from(payload.dataBase64, "base64"));
  const url = await uploadToBunny(path, bytes, payload.mimeType);

  return prisma.asset.create({
    data: {
      orgId,
      id,
      contentItemId,
      filename: payload.filename,
      mimeType: payload.mimeType,
      url,
      path,
      width: payload.width,
      height: payload.height,
    },
    select: ASSET_SELECT,
  });
}

export async function deleteAssetAction(id: string): Promise<void> {
  const orgId = await activeOrgId();
  const asset = await prisma.asset.findUnique({
    where: pk(orgId, id),
    select: { path: true },
  });
  await prisma.asset.delete({ where: pk(orgId, id) });
  if (asset?.path) await deleteFromBunny(asset.path);
}

export async function resetAllAction(): Promise<PlannerState> {
  const orgId = await activeOrgId();
  await prisma.$transaction([
    prisma.contentItem.deleteMany({ where: { orgId } }),
    prisma.week.deleteMany({ where: { orgId } }),
    prisma.subcategory.deleteMany({ where: { orgId } }),
    prisma.category.deleteMany({ where: { orgId } }),
  ]);
  return { categories: [], subcategories: [], weeks: [], contentItems: [] };
}
