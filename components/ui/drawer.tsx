"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onOpenChange,
  title,
  subtitle,
  accent,
  headerExtra,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  accent?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 [animation:overlay-in_140ms_ease]" />
        <Dialog.Content
          className={cn(
            "fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[480px] flex-col",
            "border-l-2 border-ink bg-paper [animation:drawer-in_200ms_cubic-bezier(0.2,0.9,0.3,1)]",
          )}
        >
          <div
            className="flex items-start gap-3 border-b-2 border-ink px-5 py-4"
            style={accent ? { backgroundColor: accent } : undefined}
          >
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate font-display text-xl font-extrabold">
                {title}
              </Dialog.Title>
              {subtitle ? (
                <Dialog.Description className="mt-0.5 text-sm font-semibold text-ink/70">
                  {subtitle}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">
                  Editor panel
                </Dialog.Description>
              )}
            </div>
            {headerExtra}
            <Dialog.Close
              className="grid size-8 shrink-0 place-items-center rounded-md border-2 border-ink bg-white shadow-hard-sm push"
              aria-label="Close"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
