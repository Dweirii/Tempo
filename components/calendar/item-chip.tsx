"use client";

import { useDraggable } from "@dnd-kit/core";
import { Paperclip } from "lucide-react";
import type { ContentItem } from "@/lib/types";
import { FORMAT_META, STATUS_META } from "@/lib/ui";
import { usePlanner } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ChipFace({
  item,
  dragging,
  hasAsset,
  className,
}: {
  item: ContentItem;
  dragging?: boolean;
  hasAsset?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-1 rounded-md border-2 border-ink px-1.5 py-1 text-left",
        dragging && "rotate-[-2deg] shadow-hard",
        className,
      )}
      style={{ backgroundColor: FORMAT_META[item.format].bg }}
    >
      <span className="min-w-0 flex-1 truncate text-[10px] font-extrabold leading-tight text-ink">
        {item.slot}
      </span>
      {hasAsset ? (
        <Paperclip className="size-2.5 shrink-0 text-ink/70" strokeWidth={3} />
      ) : null}
      <span
        className="size-2 shrink-0 rounded-full border border-ink"
        style={{ background: STATUS_META[item.status].bg }}
        title={item.status}
      />
    </div>
  );
}

export function ItemChip({
  item,
  onSelect,
}: {
  item: ContentItem;
  onSelect: (id: string) => void;
}) {
  const { assets } = usePlanner();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { type: "item" },
  });
  const hasAsset = assets.some((a) => a.contentItemId === item.id);

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full cursor-grab touch-none active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <ChipFace item={item} hasAsset={hasAsset} />
    </button>
  );
}
