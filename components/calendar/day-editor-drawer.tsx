"use client";

import { Trash2 } from "lucide-react";
import { usePlanner } from "@/lib/store";
import { STATUSES } from "@/lib/types";
import { OWNERS, OWNER_META, STATUS_META, FORMAT_META } from "@/lib/ui";
import { weekById, categoryById, subcategoryById } from "@/lib/selectors";
import { formatDayLabel, DAY_NAMES_LONG, parseISODate } from "@/lib/dates";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { FormatPill } from "@/components/ui/tags";
import { AssetGallery } from "./asset-gallery";

export function DayEditorDrawer({
  itemId,
  open,
  onOpenChange,
}: {
  itemId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { state, updateItem, setStatus, moveItem, updateWeek, setStory } =
    usePlanner();
  const item = itemId
    ? state.contentItems.find((i) => i.id === itemId)
    : undefined;
  const week = item ? weekById(state, item.weekId) : undefined;
  const category = week ? categoryById(state, week.categoryId) : undefined;
  const subcategory = week ? subcategoryById(state, week.subcategoryId) : undefined;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      accent={item ? FORMAT_META[item.format].bg : undefined}
      title={item ? item.slot : "Content"}
      subtitle={
        item ? (
          <span className="flex items-center gap-2">
            <FormatPill format={item.format} />
            {formatDayLabel(item.date)}
          </span>
        ) : undefined
      }
    >
      {item && week ? (
        <div className="flex flex-col gap-5">
          {/* Context strip */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border-2 border-ink bg-white px-3 py-2 text-xs font-bold">
            {category ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full border-2 border-ink"
                  style={{ background: category.color }}
                />
                {category.name}
              </span>
            ) : null}
            <span className="text-muted">·</span>
            <span>Week {week.weekNumber}</span>
            <span className="text-muted">·</span>
            <span className="truncate text-muted">{subcategory?.name}</span>
          </div>

          {/* Status / Owner / Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select
                value={item.status}
                onValueChange={(v) =>
                  setStatus(item.id, v as (typeof STATUSES)[number])
                }
                options={STATUSES.map((s) => ({
                  value: s,
                  label: s,
                  color: STATUS_META[s].bg,
                }))}
              />
            </Field>
            <Field label="Owner">
              <Select
                value={item.owner}
                onValueChange={(v) =>
                  updateItem(item.id, { owner: v as (typeof OWNERS)[number] })
                }
                options={OWNERS.map((o) => ({
                  value: o,
                  label: o,
                  color: OWNER_META[o].bg,
                }))}
              />
            </Field>
          </div>

          <Field label="Assignee">
            <Input
              value={item.assignee}
              placeholder="Who's on it?"
              onChange={(e) => updateItem(item.id, { assignee: e.target.value })}
            />
          </Field>

          <Field label="Concept">
            <Textarea
              value={item.concept}
              onChange={(e) => updateItem(item.id, { concept: e.target.value })}
            />
          </Field>

          <Field label="Caption">
            <Textarea
              value={item.caption}
              placeholder="Write the caption…"
              onChange={(e) => updateItem(item.id, { caption: e.target.value })}
            />
          </Field>

          <Field label="Hashtags">
            <Input
              value={item.hashtags}
              placeholder="#mockup #branding"
              onChange={(e) => updateItem(item.id, { hashtags: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Trending audio">
              <Input
                value={item.trendingAudio}
                placeholder="Sound name"
                onChange={(e) =>
                  updateItem(item.id, { trendingAudio: e.target.value })
                }
              />
            </Field>
            <Field label="Product SKU">
              <Input
                value={item.productSku}
                placeholder="SKU-000"
                onChange={(e) =>
                  updateItem(item.id, { productSku: e.target.value })
                }
              />
            </Field>
          </div>

          <Field label="Asset URL">
            <Input
              value={item.assetUrl}
              placeholder="https://…"
              onChange={(e) => updateItem(item.id, { assetUrl: e.target.value })}
            />
          </Field>

          <AssetGallery itemId={item.id} />

          <Field label="Scheduled date" hint="Move this item to another day.">
            <Input
              type="date"
              value={item.date}
              onChange={(e) =>
                e.target.value && moveItem(item.id, e.target.value)
              }
            />
          </Field>

          {/* Week-level editable bits */}
          <div className="flex flex-col gap-4 rounded-xl border-2 border-ink bg-pink/20 p-4">
            <div className="eyebrow">This week</div>
            <Field label="Week theme">
              <Input
                value={week.theme}
                onChange={(e) => updateWeek(week.id, { theme: e.target.value })}
              />
            </Field>
            <Field label={`Story — ${DAY_NAMES_LONG[parseISODate(item.date).getDay()]}`}>
              <Input
                value={week.storyRotation[item.dayOfWeek] ?? ""}
                placeholder="Story idea for this day"
                onChange={(e) =>
                  setStory(week.id, item.dayOfWeek, e.target.value)
                }
              />
            </Field>
          </div>

          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Trash2 className="size-3.5" />
            Edits save automatically to this device.
          </p>
        </div>
      ) : (
        <div className="grid h-40 place-items-center text-sm font-semibold text-muted">
          Select a content item to edit.
        </div>
      )}
    </Drawer>
  );
}
