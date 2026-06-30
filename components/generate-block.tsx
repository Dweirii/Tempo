"use client";

import { useState } from "react";
import { Wand2, Plus, AlertTriangle } from "lucide-react";
import { usePlanner } from "@/lib/store";
import { planNextBlock } from "@/lib/engine";
import { formatWeekRange } from "@/lib/dates";
import { Button, type ButtonProps } from "./ui/button";
import { Modal } from "./ui/modal";

export function GenerateBlockButton({
  size = "md",
  label = "Generate next block",
}: {
  size?: ButtonProps["size"];
  label?: string;
}) {
  const { state, generateBlock } = usePlanner();
  const [open, setOpen] = useState(false);

  const hasCategories = state.categories.length > 0;
  const plan = open && hasCategories ? planNextBlock(state, new Date()) : null;
  const emptyQueue = !!plan && plan.weeks.length === 0;
  const canCreate = !!plan && plan.weeks.length > 0;

  return (
    <>
      <Button
        variant="primary"
        size={size}
        onClick={() => setOpen(true)}
        disabled={!hasCategories}
        title={hasCategories ? undefined : "Add a category first"}
      >
        <Wand2 className="size-4" strokeWidth={2.5} />
        {label}
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        accent={plan?.category.color}
        title={plan ? `Generate Block ${plan.blockNumber}` : "Generate block"}
        subtitle={
          plan && !emptyQueue
            ? `${plan.category.name} · 4 weeks · ${plan.weeks.length * 7} content items`
            : plan
              ? plan.category.name
              : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!canCreate}
              onClick={() => {
                generateBlock();
                setOpen(false);
              }}
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Create block
            </Button>
          </>
        }
      >
        {plan && emptyQueue ? (
          <div className="flex items-start gap-2 rounded-lg border-2 border-ink bg-sun px-3 py-2.5 text-sm font-bold">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
            <span>
              <b>{plan.category.name}</b> has no subcategories yet. Add some in
              the Categories tab before generating a block for it.
            </span>
          </div>
        ) : plan ? (
          <div className="flex flex-col gap-3">
            {plan.recycled ? (
              <div className="rounded-lg border-2 border-ink bg-sun px-3 py-2 text-xs font-bold">
                Queue recycled — every {plan.category.name} subcategory had been
                used, so the queue restarts from the top.
              </div>
            ) : null}
            <p className="text-sm font-semibold text-muted">
              Pulls the next 4 unused subcategories from the{" "}
              <b className="text-ink">{plan.category.name}</b> queue. Each week
              gets 7 cadence items + a 7-day story rotation, all starting at{" "}
              <b className="text-ink">Idea</b>.
            </p>
            <ol className="flex flex-col gap-2">
              {plan.weeks.map((w) => (
                <li
                  key={w.weekNumber}
                  className="flex items-center gap-3 rounded-lg border-2 border-ink bg-white px-3 py-2"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border-2 border-ink bg-pink text-xs font-extrabold">
                    W{w.weekNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold">
                      {w.subcategory.name}
                    </div>
                    <div className="font-mono text-[11px] font-semibold text-muted">
                      {formatWeekRange(w.startDate)} · {w.itemCount} items +{" "}
                      {w.storyCount} stories
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
