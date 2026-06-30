"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  subtitle,
  accent,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  accent?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 [animation:overlay-in_140ms_ease]" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border-2 border-ink bg-paper shadow-hard-lg [animation:pop-in_180ms_cubic-bezier(0.2,0.9,0.3,1)]",
            className,
          )}
        >
          <div
            className="flex items-start gap-3 rounded-t-[0.6rem] border-b-2 border-ink px-5 py-4"
            style={accent ? { backgroundColor: accent } : undefined}
          >
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-xl font-extrabold">
                {title}
              </Dialog.Title>
              {subtitle ? (
                <Dialog.Description className="mt-0.5 text-sm font-semibold text-ink/70">
                  {subtitle}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Dialog</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="grid size-8 shrink-0 place-items-center rounded-md border-2 border-ink bg-white shadow-hard-sm push"
              aria-label="Close"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-5 py-5">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t-2 border-ink px-5 py-3">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
